import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateRecommendationDto } from './dto/generate-recommendation.dto';

const LOAN_TERM_MONTHS = 60;
const AFFORDABILITY_THRESHOLD = 0.30;
const TOP_N = 10;

function getAnnualInterestRate(creditScore: number): number {
  if (creditScore >= 750) return 0.05;
  if (creditScore >= 700) return 0.07;
  if (creditScore >= 650) return 0.10;
  if (creditScore >= 600) return 0.13;
  return 0.16;
}

function calcMonthlyLoan(price: number, annualRate: number): number {
  const r = annualRate / 12;
  const n = LOAN_TERM_MONTHS;
  if (r === 0) return price / n;
  return price * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function estimateFuelCost(fuelType: string | null): number {
  switch (fuelType?.toLowerCase()) {
    case 'petrol': return 1500;
    case 'diesel': return 1300;
    case 'electric': return 500;
    case 'hybrid': return 900;
    default: return 1200;
  }
}

function estimateMaintenanceCost(year: number | null, mileage: number | null): number {
  let cost = 600;
  const currentYear = new Date().getFullYear();
  if (year && currentYear - year > 5) cost += 400;
  if (mileage && mileage > 100000) cost += 500;
  return cost;
}

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(dto: GenerateRecommendationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { preferences: true },
    });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);
    if (!user.netSalary || !user.creditScore) {
      throw new NotFoundException('User must have netSalary and creditScore set');
    }

    const netSalary = Number(user.netSalary);
    const creditScore = user.creditScore;
    const preference = user.preferences[0] ?? null;
    const annualRate = getAnnualInterestRate(creditScore);

    const cars = await this.prisma.car.findMany({
      include: { insuranceEstimates: true },
    });

    const scored = cars
      .filter(car => car.price !== null)
      .map(car => {
        const price = Number(car.price);
        const loanCost = calcMonthlyLoan(price, annualRate);

        // Insurance: prefer user's location, fall back to average
        const locationEstimate = car.insuranceEstimates.find(
          e => e.location?.toLowerCase() === user.location?.toLowerCase(),
        );
        const insuranceCost = locationEstimate
          ? Number(locationEstimate.estimatedMonthly)
          : car.insuranceEstimates.length > 0
            ? car.insuranceEstimates.reduce((sum, e) => sum + Number(e.estimatedMonthly ?? 0), 0) / car.insuranceEstimates.length
            : 800;

        const fuelCost = estimateFuelCost(car.fuelType);
        const maintenanceCost = estimateMaintenanceCost(car.year, car.mileage);
        const estimatedMonthlyCost = loanCost + insuranceCost + fuelCost + maintenanceCost;

        if (estimatedMonthlyCost / netSalary > AFFORDABILITY_THRESHOLD) return null;

        // Preference match (0–4)
        let preferenceScore = 0;
        if (preference) {
          if (preference.preferredBrand && car.make?.toLowerCase().includes(preference.preferredBrand.toLowerCase())) preferenceScore++;
          if (preference.fuelType && car.fuelType?.toLowerCase() === preference.fuelType.toLowerCase()) preferenceScore++;
          if (preference.transmission && car.transmission?.toLowerCase() === preference.transmission.toLowerCase()) preferenceScore++;
        }

        const affordabilityScore = 1 - estimatedMonthlyCost / netSalary;
        const finalScore = affordabilityScore * 0.7 + (preferenceScore / 4) * 0.3;

        return {
          car,
          estimatedMonthlyCost,
          insuranceCost,
          loanCost,
          maintenanceCost,
          fuelCost,
          score: finalScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, TOP_N);

    // Persist recommendations
    await this.prisma.recommendation.deleteMany({ where: { userId: dto.userId } });
    const saved = await Promise.all(
      scored.map(r =>
        this.prisma.recommendation.create({
          data: {
            userId: dto.userId,
            carId: r!.car.id,
            estimatedMonthlyCost: r!.estimatedMonthlyCost,
            insuranceCost: r!.insuranceCost,
            loanCost: r!.loanCost,
            maintenanceCost: r!.maintenanceCost,
            fuelCost: r!.fuelCost,
            score: r!.score,
          },
          include: { car: true },
        }),
      ),
    );

    return saved;
  }

  async findByUser(userId: string) {
    return this.prisma.recommendation.findMany({
      where: { userId },
      include: { car: true },
      orderBy: { score: 'desc' },
    });
  }
}
