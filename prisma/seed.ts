import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter } as any);
}

// ── Province risk factors ────────────────────────────────────────────────────
const PROVINCES = [
  { name: 'Gauteng',        factor: 1.30 },
  { name: 'Western Cape',   factor: 1.20 },
  { name: 'KwaZulu-Natal',  factor: 1.15 },
  { name: 'Eastern Cape',   factor: 1.10 },
  { name: 'Mpumalanga',     factor: 0.95 },
  { name: 'North West',     factor: 0.92 },
  { name: 'Free State',     factor: 0.88 },
  { name: 'Limpopo',        factor: 0.85 },
  { name: 'Northern Cape',  factor: 0.82 },
];

// ── Risk category multipliers ────────────────────────────────────────────────
const RISK_FACTORS = [
  { category: 'low',    factor: 0.70 },
  { category: 'medium', factor: 1.00 },
  { category: 'high',   factor: 1.45 },
];

// Base: 2.5 % of car value per year, divided into monthly
const BASE_ANNUAL_RATE = 0.025;

function calcInsurance(price: number, locationFactor: number, riskFactor: number): number {
  return Math.round((price * BASE_ANNUAL_RATE / 12) * locationFactor * riskFactor);
}

// ── Car catalogue ────────────────────────────────────────────────────────────
const CARS = [
  // Budget hatchbacks ─────────────────────────────────────────────────────────
  { make: 'Renault',       model: 'Kwid 1.0 Dynamique',              year: 2022, price: 149_900, mileage: 28_500, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 5.0 },
  { make: 'Suzuki',        model: 'Swift 1.2 GL',                    year: 2023, price: 198_900, mileage: 15_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 5.5 },
  { make: 'Kia',           model: 'Picanto 1.2 Smart',               year: 2023, price: 209_900, mileage: 12_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 5.2 },
  { make: 'Toyota',        model: 'Starlet 1.4 XS',                  year: 2022, price: 189_900, mileage: 35_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 7.5 },
  { make: 'Toyota',        model: 'Starlet 1.5 XR',                  year: 2023, price: 225_000, mileage: 18_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.2 },
  { make: 'Hyundai',       model: 'i20 1.4 Fluid',                   year: 2022, price: 249_900, mileage: 42_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.0 },
  { make: 'Volkswagen',    model: 'Polo 1.0 TSI Trendline',          year: 2021, price: 249_900, mileage: 48_200, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 5.8 },
  { make: 'Volkswagen',    model: 'Polo 1.0 TSI Life',               year: 2022, price: 279_900, mileage: 30_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 5.8 },
  { make: 'Nissan',        model: 'Magnite 1.0 Turbo Acenta+',       year: 2023, price: 289_900, mileage: 11_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.5 },
  { make: 'Haval',         model: 'Jolion 1.5T City',                year: 2023, price: 319_900, mileage:  9_500, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.2 },

  // Mid-range sedans & SUVs ───────────────────────────────────────────────────
  { make: 'Toyota',        model: 'Corolla Cross 1.8 XS Hybrid',     year: 2023, price: 389_900, mileage: 22_000, fuelType: 'hybrid',  transmission: 'automatic', fuelEfficiency: 4.5 },
  { make: 'Ford',          model: 'EcoSport 1.0 EcoBoost Titanium',  year: 2022, price: 319_900, mileage: 38_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.8 },
  { make: 'Mazda',         model: '3 2.0 Individual Plus',           year: 2023, price: 449_900, mileage: 14_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.0 },
  { make: 'Hyundai',       model: 'Tucson 2.0 Premium',              year: 2022, price: 449_900, mileage: 41_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.5 },
  { make: 'Volkswagen',    model: 'Golf 8 1.4 TSI Life',             year: 2022, price: 469_900, mileage: 28_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.0 },
  { make: 'Honda',         model: 'Civic 1.5 VTEC Sport',            year: 2023, price: 399_900, mileage: 16_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.4 },
  { make: 'Kia',           model: 'Sportage 1.6T EX',                year: 2023, price: 479_900, mileage:  8_500, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.8 },

  // Bakkies ───────────────────────────────────────────────────────────────────
  { make: 'Toyota',        model: 'Hilux 2.4 GD-6 SRX',             year: 2023, price: 499_900, mileage: 18_500, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency: 9.0 },
  { make: 'Isuzu',         model: 'D-Max 1.9 DDTi LS',              year: 2023, price: 469_900, mileage: 26_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 7.8 },
  { make: 'Ford',          model: 'Ranger 2.0 SiT XL',              year: 2022, price: 509_900, mileage: 32_000, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency: 8.5 },

  // Premium sedans ────────────────────────────────────────────────────────────
  { make: 'BMW',           model: '3 Series 320i M Sport',           year: 2022, price: 699_900, mileage: 25_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.5 },
  { make: 'Mercedes-Benz', model: 'C200 AMG Line',                   year: 2022, price: 749_900, mileage: 19_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.8 },
  { make: 'Audi',          model: 'A4 2.0 TFSI S Line',             year: 2023, price: 779_900, mileage: 12_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.0 },

  // Premium SUVs ──────────────────────────────────────────────────────────────
  { make: 'Toyota',        model: 'Fortuner 2.8 GD-6 4x4 Epic',     year: 2023, price: 749_900, mileage: 21_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 9.5 },
  { make: 'Land Rover',    model: 'Discovery Sport P200',            year: 2023, price: 999_900, mileage:  8_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.0 },
  { make: 'BMW',           model: '5 Series 520d M Sport',           year: 2022, price: 1_099_900, mileage: 32_000, fuelType: 'diesel', transmission: 'automatic', fuelEfficiency: 5.8 },
  { make: 'Porsche',       model: 'Cayenne 3.0 TFSI',               year: 2022, price: 1_599_900, mileage: 15_000, fuelType: 'petrol', transmission: 'automatic', fuelEfficiency: 9.5 },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const prisma = createPrisma();

  try {
    console.log('\n🌱  Clearing existing car & insurance data...');
    await prisma.insuranceEstimate.deleteMany();
    await prisma.recommendation.deleteMany();
    await prisma.car.deleteMany();

    console.log(`🚗  Seeding ${CARS.length} cars with insurance estimates for ${PROVINCES.length} provinces × ${RISK_FACTORS.length} risk tiers...\n`);

    for (const carData of CARS) {
      const car = await prisma.car.create({
        data: {
          make: carData.make,
          model: carData.model,
          year: carData.year,
          price: carData.price,
          mileage: carData.mileage,
          fuelType: carData.fuelType,
          transmission: carData.transmission,
          fuelEfficiency: carData.fuelEfficiency,
          scrapedSource: 'seed',
        },
      });

      const estimates = PROVINCES.flatMap((province) =>
        RISK_FACTORS.map((risk) => ({
          carId: car.id,
          location: province.name,
          riskCategory: risk.category,
          estimatedMonthly: calcInsurance(carData.price, province.factor, risk.factor),
        })),
      );

      await prisma.insuranceEstimate.createMany({ data: estimates });

      const loGauteng = calcInsurance(carData.price, 1.30, 0.70);
      const hiGauteng = calcInsurance(carData.price, 1.30, 1.45);
      console.log(`  ✔  ${carData.make.padEnd(15)} ${carData.model.padEnd(35)} R${carData.price.toLocaleString().padStart(10)}  │  Gauteng: R${loGauteng}–R${hiGauteng}/mo`);
    }

    const totalEstimates = CARS.length * PROVINCES.length * RISK_FACTORS.length;
    console.log(`\n✅  Seeded ${CARS.length} cars and ${totalEstimates} insurance estimates.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
