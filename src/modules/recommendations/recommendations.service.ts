import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateRecommendationDto } from './dto/generate-recommendation.dto';

const LOAN_TERM_MONTHS = 60;
const AFFORDABILITY_RATIO = 0.20;
const MONTHLY_DISTANCE_KM = 1200;
const FUEL_PRICE_PER_LITRE = 22;
const TOP_N = 10;

function extractAgeFromId(idNumber: string): number | null {
  if (!idNumber || idNumber.length < 6) return null;
  const yy = parseInt(idNumber.substring(0, 2), 10);
  const mm = parseInt(idNumber.substring(2, 4), 10);
  const dd = parseInt(idNumber.substring(4, 6), 10);
  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null;
  const currentYY = new Date().getFullYear() % 100;
  const birthYear = yy <= currentYY ? 2000 + yy : 1900 + yy;
  const today = new Date();
  const birthDate = new Date(birthYear, mm - 1, dd);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// Spec §2.2 simplified MVP: LoanCost = CarPrice / LoanTerm
function calcMonthlyLoan(price: number): number {
  return price / LOAN_TERM_MONTHS;
}

// Spec §2.3: FuelCost = (Distance / 100) × FuelEfficiency(L/100km) × FuelPrice
function calcFuelCost(fuelEfficiency: number | null, fuelType: string | null): number {
  if (fuelEfficiency && fuelEfficiency > 0) {
    return (MONTHLY_DISTANCE_KM / 100) * fuelEfficiency * FUEL_PRICE_PER_LITRE;
  }
  // Fallback by fuel type when fuelEfficiency not in DB
  switch (fuelType?.toLowerCase()) {
    case 'electric': return 500;
    case 'hybrid': return (MONTHLY_DISTANCE_KM / 100) * 4.5 * FUEL_PRICE_PER_LITRE;
    case 'diesel': return (MONTHLY_DISTANCE_KM / 100) * 7.5 * FUEL_PRICE_PER_LITRE;
    default: return (MONTHLY_DISTANCE_KM / 100) * 9.0 * FUEL_PRICE_PER_LITRE; // petrol
  }
}

// Spec §2.4: Maintenance = CarPrice × 0.01 / 12
function calcMaintenanceCost(price: number): number {
  return (price * 0.01) / 12;
}

// Map credit score to the risk category used in insurance_estimates table
function creditScoreToRiskCategory(creditScore: number): string {
  if (creditScore >= 700) return 'low';
  if (creditScore >= 600) return 'medium';
  return 'high';
}

// Look up insurance cost from seeded insurance_estimates rows.
// Falls back to formula-based estimate if no matching row exists.
function lookupInsuranceCost(
  insuranceEstimates: { location: string | null; riskCategory: string | null; estimatedMonthly: any }[],
  price: number,
  userLocation: string | null,
  creditScore: number,
): number {
  const riskCategory = creditScoreToRiskCategory(creditScore);
  const userProv = userLocation?.toLowerCase() ?? '';

  // Find estimate matching both province and risk tier
  const match = insuranceEstimates.find(e => {
    const estProv = e.location?.toLowerCase() ?? '';
    return estProv === userProv && e.riskCategory === riskCategory;
  });
  if (match) return Number(match.estimatedMonthly);

  // Partial match: same risk tier, any province (use average)
  const sameTier = insuranceEstimates.filter(e => e.riskCategory === riskCategory);
  if (sameTier.length > 0) {
    const avg = sameTier.reduce((sum, e) => sum + Number(e.estimatedMonthly), 0) / sameTier.length;
    return avg;
  }

  // Last resort: 2.5% of car value per year / 12 months
  return (price * 0.025) / 12;
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

    // Spec §2.1: Affordable Monthly Budget = netSalary × 0.20
    const affordableBudget = netSalary * AFFORDABILITY_RATIO;

    const age = user.idNumber ? extractAgeFromId(user.idNumber) : null;

    const cars = await this.prisma.car.findMany({
      include: { insuranceEstimates: true },
    });

    const scored = cars
      .filter(car => car.price !== null)
      .map(car => {
        const price = Number(car.price);
        const fuelEff = car.fuelEfficiency ? Number(car.fuelEfficiency) : null;

        // Spec §2.2 simplified MVP
        const loanCost = calcMonthlyLoan(price);

        // §2.5 insurance: look up from seeded insurance_estimates table
        const insuranceCost = lookupInsuranceCost(
          car.insuranceEstimates,
          price,
          user.location,
          creditScore,
        );

        // Spec §2.3 fuel cost formula
        const fuelCost = calcFuelCost(fuelEff, car.fuelType);

        // Spec §2.4 maintenance formula
        const maintenanceCost = calcMaintenanceCost(price);

        // Spec §2.6 total monthly cost
        const estimatedMonthlyCost = loanCost + insuranceCost + fuelCost + maintenanceCost;

        // Spec §2.7 affordability check
        if (estimatedMonthlyCost > affordableBudget) return null;

        // Preference match score (0–4 points)
        let preferenceScore = 0;
        if (preference) {
          if (preference.preferredBrand && car.make?.toLowerCase().includes(preference.preferredBrand.toLowerCase())) preferenceScore++;
          if (preference.fuelType && car.fuelType?.toLowerCase() === preference.fuelType.toLowerCase()) preferenceScore++;
          if (preference.transmission && car.transmission?.toLowerCase() === preference.transmission.toLowerCase()) preferenceScore++;
          if (preference.carType) preferenceScore++; // car type in preference stored but not on Car model directly
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
