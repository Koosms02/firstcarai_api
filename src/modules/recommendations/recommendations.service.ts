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

// Spec §2.3: FuelCost = (Distance / FuelEfficiency) × FuelPrice
function calcFuelCost(fuelEfficiency: number | null, fuelType: string | null): number {
  if (fuelEfficiency && fuelEfficiency > 0) {
    return (MONTHLY_DISTANCE_KM / fuelEfficiency) * FUEL_PRICE_PER_LITRE;
  }
  // Fallback by fuel type when fuelEfficiency not in DB
  switch (fuelType?.toLowerCase()) {
    case 'electric': return 500;
    case 'hybrid': return 900;
    case 'diesel': return (MONTHLY_DISTANCE_KM / 17) * FUEL_PRICE_PER_LITRE;
    default: return (MONTHLY_DISTANCE_KM / 13) * FUEL_PRICE_PER_LITRE; // petrol
  }
}

// Spec §2.4: Maintenance = CarPrice × 0.01 / 12
function calcMaintenanceCost(price: number): number {
  return (price * 0.01) / 12;
}

// Spec §2.5: Insurance = BaseRate × RiskFactor × CarValueFactor
// Influenced by: age, location, car type, credit score
function calcInsuranceCost(
  price: number,
  carType: string | null,
  age: number | null,
  province: string | null,
  creditScore: number,
): number {
  const BASE_RATE = 500;

  let ageFactor = 1.0;
  if (age !== null) {
    if (age < 25) ageFactor = 1.8;
    else if (age < 30) ageFactor = 1.4;
    else if (age <= 50) ageFactor = 1.0;
    else ageFactor = 1.2;
  }

  let creditFactor = 1.0;
  if (creditScore >= 750) creditFactor = 0.85;
  else if (creditScore >= 700) creditFactor = 0.90;
  else if (creditScore >= 650) creditFactor = 1.00;
  else if (creditScore >= 600) creditFactor = 1.10;
  else creditFactor = 1.25;

  const prov = province?.toLowerCase() ?? '';
  let locationFactor = 1.0;
  if (prov.includes('gauteng')) locationFactor = 1.30;
  else if (prov.includes('western cape')) locationFactor = 1.20;
  else if (prov.includes('kwazulu') || prov.includes('natal')) locationFactor = 1.15;
  else if (prov.includes('eastern cape')) locationFactor = 1.10;

  const ct = carType?.toLowerCase() ?? '';
  let carTypeFactor = 1.0;
  if (ct === 'suv') carTypeFactor = 1.20;
  else if (ct === 'bakkie') carTypeFactor = 1.15;

  const carValueFactor = price / 100000;

  return BASE_RATE * ageFactor * creditFactor * locationFactor * carTypeFactor * carValueFactor;
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

        // Spec §2.5 insurance formula
        const insuranceCost = calcInsuranceCost(
          price,
          preference?.carType ?? null,
          age,
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
