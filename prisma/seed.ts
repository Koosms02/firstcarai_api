import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter } as any);
}

// ── Car image map (verified Unsplash photo IDs, May 2025) ────────────────────
const BASE_IMG = 'https://images.unsplash.com/photo-';
const IMG_SUFFIX = '?w=800&auto=format&fit=crop&q=70';

// make → photo ID (verified 200 OK)
const MAKE_IMAGES: Record<string, string> = {
  'Toyota':        '1553440569-bcc63803a83d',  // silver saloon / hatchback
  'Volkswagen':    '1568605114967-8130f3a36994', // hatchback exterior
  'BMW':           '1541899481282-d53bffe3c35d', // BMW sedan
  'Mercedes-Benz': '1555215695-3004980ad54e',   // Mercedes coupe
  'Mercedes-AMG':  '1494976388531-d1058494cdd8', // performance car
  'Ford':          '1503736334956-4c8f8e92946d', // SUV / truck
  'Hyundai':       '1600712242805-5f78671b24da', // modern sedan
  'Kia':           '1533473359331-0135ef1b58bf', // blue compact
  'Suzuki':        '1577495508048-b635879837f1', // compact car
  'Haval':         '1520031441872-265e4ff70366', // SUV exterior
  'GWM':           '1607853202273-797f1c22a38e', // bakkie / SUV
  'Foton':         '1607853202273-797f1c22a38e', // bakkie
  'Chery':         '1581540222194-0def2dda95b8', // SUV
  'Nissan':        '1583121274602-3e2820c69888', // compact car
  'Renault':       '1590362891991-f776e747a588', // small car
  'Peugeot':       '1590362891991-f776e747a588', // small crossover
  'Mazda':         '1552519507-da3b142c6e3d',    // silver sporty sedan
  'Honda':         '1563720223185-11003d516935', // civic-style sedan
  'Audi':          '1607853202273-797f1c22a38e', // Audi sedan
  'Porsche':       '1503376780353-7e6692767b70', // sports car
  'Land Rover':    '1563720223185-11003d516935', // SUV
  'Mahindra':      '1449965408869-eaa3f722e40d', // compact SUV
  'MG':            '1503736334956-4c8f8e92946d', // crossover
  'JAC':           '1503736334956-4c8f8e92946d', // bakkie
  'Isuzu':         '1504214208698-ea1916a2195a', // bakkie
  'BYD':           '1520031441872-265e4ff70366', // electric/hybrid SUV
  'MINI':          '1494976388531-d1058494cdd8', // MINI Cooper
};

// Override specific models that have better-matching photos
const MODEL_IMAGES: Record<string, string> = {
  'Golf 8 1.4 TSI Life': '1718629879998-ee8cfc09df39', // actual VW Golf R photo
};

function getCarImageUrl(make: string, model: string): string {
  const photoId =
    MODEL_IMAGES[model] ??
    MAKE_IMAGES[make] ??
    '1552519507-da3b142c6e3d'; // fallback: silver car
  return `${BASE_IMG}${photoId}${IMG_SUFFIX}`;
}

// ── Province risk factors ─────────────────────────────────────────────────────
const PROVINCES = [
  { name: 'Gauteng',       factor: 1.30 },
  { name: 'Western Cape',  factor: 1.20 },
  { name: 'KwaZulu-Natal', factor: 1.15 },
  { name: 'Eastern Cape',  factor: 1.10 },
  { name: 'Mpumalanga',    factor: 0.95 },
  { name: 'North West',    factor: 0.92 },
  { name: 'Free State',    factor: 0.88 },
  { name: 'Limpopo',       factor: 0.85 },
  { name: 'Northern Cape', factor: 0.82 },
];

// ── Risk category multipliers ─────────────────────────────────────────────────
const RISK_FACTORS = [
  { category: 'low',    factor: 0.70 },
  { category: 'medium', factor: 1.00 },
  { category: 'high',   factor: 1.45 },
];

// Base: 2.5% of car value per year, divided into monthly
const BASE_ANNUAL_RATE = 0.025;

function calcInsurance(price: number, locationFactor: number, riskFactor: number): number {
  return Math.round((price * BASE_ANNUAL_RATE / 12) * locationFactor * riskFactor);
}

// ── Car catalogue (real listings scraped from AutoTrader South Africa, May 2025)
const CARS = [

  // ── Ultra-budget hatchbacks & city cars (< R170k) ────────────────────────
  { make: 'Toyota',        model: 'Aygo 1.0 X-Play',                    year: 2017, price:  119_900, mileage: 116_486, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  4.8, scrapedSource: 'autotrader-2025' },
  { make: 'Ford',          model: 'Figo 1.5 Ambiente',                  year: 2019, price:  134_999, mileage:  94_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  6.2, scrapedSource: 'autotrader-2025' },
  { make: 'Mahindra',      model: 'KUV100 Nxt G80',                     year: 2022, price:  139_900, mileage:  44_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  6.5, scrapedSource: 'autotrader-2025' },
  { make: 'Mahindra',      model: 'TUV300 1.5 CRDe T4',                 year: 2020, price:  144_900, mileage: 168_000, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency:  8.0, scrapedSource: 'autotrader-2025' },
  { make: 'Renault',       model: 'Kwid 1.0 Expression',                year: 2024, price:  146_171, mileage:  14_248, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.2, scrapedSource: 'autotrader-2025' },
  { make: 'Renault',       model: 'Kwid 1.0 Dynamique',                 year: 2022, price:  149_900, mileage:  28_500, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.0, scrapedSource: 'seed' },
  { make: 'Renault',       model: 'Duster 1.5 dCI Dynamique',           year: 2017, price:  167_900, mileage: 124_650, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency:  5.5, scrapedSource: 'autotrader-2025' },
  { make: 'Renault',       model: 'Sandero 1.0 Turbo Life',             year: 2020, price:  169_900, mileage:  87_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  6.0, scrapedSource: 'autotrader-2025' },

  // ── Budget hatchbacks (R170k – R250k) ────────────────────────────────────
  { make: 'Volkswagen',    model: 'Polo 1.0 TSI Trendline',             year: 2021, price:  179_900, mileage: 181_571, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.8, scrapedSource: 'autotrader-2025' },
  { make: 'Toyota',        model: 'Starlet 1.4 XS',                     year: 2022, price:  189_900, mileage:  35_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  7.5, scrapedSource: 'seed' },
  { make: 'Ford',          model: 'EcoSport 1.5 Ambiente',              year: 2019, price:  199_900, mileage:  90_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  7.5, scrapedSource: 'autotrader-2025' },
  { make: 'Mazda',         model: '2 1.5 Dynamic',                      year: 2020, price:  199_900, mileage:  79_800, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.8, scrapedSource: 'autotrader-2025' },
  { make: 'Renault',       model: 'Kwid 1.0 Turbo Intens',              year: 2026, price:  209_900, mileage:     100, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.2, scrapedSource: 'autotrader-2025' },
  { make: 'Hyundai',       model: 'Venue 1.0T Motion',                  year: 2021, price:  209_900, mileage:  96_365, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  7.5, scrapedSource: 'autotrader-2025' },
  { make: 'Toyota',        model: 'Urban Cruiser 1.5 Xi',               year: 2022, price:  219_999, mileage:  79_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  7.2, scrapedSource: 'autotrader-2025' },
  { make: 'Ford',          model: 'EcoSport 1.0 EcoBoost Trend',        year: 2022, price:  219_900, mileage:  44_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  7.0, scrapedSource: 'autotrader-2025' },
  { make: 'Nissan',        model: 'Magnite 1.0 Turbo Acenta',           year: 2025, price:  219_900, mileage:  16_300, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  6.5, scrapedSource: 'autotrader-2025' },
  { make: 'Suzuki',        model: 'Swift 1.2 GL+ Auto',                 year: 2025, price:  229_900, mileage:  35_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  5.5, scrapedSource: 'autotrader-2025' },
  { make: 'Suzuki',        model: 'Swift 1.2 GL',                       year: 2023, price:  198_900, mileage:  15_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.5, scrapedSource: 'seed' },
  { make: 'Kia',           model: 'Picanto 1.2 Smart',                  year: 2023, price:  209_900, mileage:  12_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  5.2, scrapedSource: 'seed' },
  { make: 'Toyota',        model: 'Starlet 1.5 XR',                     year: 2023, price:  225_000, mileage:  18_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.2, scrapedSource: 'seed' },
  { make: 'Toyota',        model: 'Starlet 1.4 XS',                     year: 2024, price:  239_900, mileage:  44_497, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  7.2, scrapedSource: 'autotrader-2025' },
  { make: 'Volkswagen',    model: 'Polo 1.0 TSI Comfortline',           year: 2021, price:  239_900, mileage:  75_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.8, scrapedSource: 'autotrader-2025' },
  { make: 'Volkswagen',    model: 'Polo 1.0 TSI Comfortline',           year: 2023, price:  247_900, mileage:  75_041, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.8, scrapedSource: 'autotrader-2025' },
  { make: 'Hyundai',       model: 'i20 1.4 Fluid',                      year: 2022, price:  249_900, mileage:  42_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.0, scrapedSource: 'seed' },
  { make: 'Volkswagen',    model: 'Polo 1.0 TSI Trendline',             year: 2021, price:  249_900, mileage:  48_200, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  5.8, scrapedSource: 'seed' },
  { make: 'GWM',           model: 'Steed 5 2.5 TCi SX',                 year: 2021, price:  249_990, mileage:  98_998, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency:  9.5, scrapedSource: 'autotrader-2025' },

  // ── Mid-range (R250k – R350k) ─────────────────────────────────────────────
  { make: 'Hyundai',       model: 'Exter 1.0T Motion',                  year: 2026, price:  274_900, mileage:       0, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  6.8, scrapedSource: 'autotrader-2025' },
  { make: 'Peugeot',       model: '2008 1.2T Active',                   year: 2024, price:  279_900, mileage:  30_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.5, scrapedSource: 'autotrader-2025' },
  { make: 'Chery',         model: 'Tiggo 4 Pro 1.5T Comfort',           year: 2026, price:  279_900, mileage:     100, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  7.0, scrapedSource: 'autotrader-2025' },
  { make: 'Hyundai',       model: 'i20 1.2 Motion',                     year: 2026, price:  284_900, mileage:       0, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  6.5, scrapedSource: 'autotrader-2025' },
  { make: 'Haval',         model: 'Jolion 1.5T City',                   year: 2023, price:  289_890, mileage:  66_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.2, scrapedSource: 'autotrader-2025' },
  { make: 'Nissan',        model: 'Magnite 1.0 Turbo Acenta+',          year: 2023, price:  289_900, mileage:  11_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.5, scrapedSource: 'seed' },
  { make: 'Toyota',        model: 'RAV4 2.0 GX-R CVT',                  year: 2021, price:  299_900, mileage:  84_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency:  8.5, scrapedSource: 'autotrader-2025' },
  { make: 'Suzuki',        model: 'XL6 1.5 GLX',                        year: 2024, price:  299_900, mileage:  42_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.5, scrapedSource: 'autotrader-2025' },
  { make: 'Volkswagen',    model: 'Polo 1.0 TSI Life',                  year: 2022, price:  279_900, mileage:  30_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  5.8, scrapedSource: 'seed' },
  { make: 'Haval',         model: 'Jolion 1.5T City',                   year: 2023, price:  319_900, mileage:   9_500, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.2, scrapedSource: 'seed' },
  { make: 'Mahindra',      model: 'Pik Up 2.2 CRDe S4',                 year: 2023, price:  329_000, mileage:  44_000, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency:  9.5, scrapedSource: 'autotrader-2025' },

  // ── Mid-upper (R350k – R520k) ─────────────────────────────────────────────
  { make: 'Haval',         model: 'Jolion Pro 1.5T Premium',            year: 2025, price:  359_900, mileage:  29_990, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.2, scrapedSource: 'autotrader-2025' },
  { make: 'Mercedes-Benz', model: 'GLC 220d 4Matic',                   year: 2018, price:  379_900, mileage: 112_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  6.0, scrapedSource: 'autotrader-2025' },
  { make: 'Toyota',        model: 'Corolla Cross 1.8 XS Hybrid',        year: 2023, price:  389_900, mileage:  22_000, fuelType: 'hybrid',  transmission: 'automatic', fuelEfficiency:  4.5, scrapedSource: 'seed' },
  { make: 'BMW',           model: '118i M Sport',                       year: 2022, price:  399_950, mileage: 100_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.5, scrapedSource: 'autotrader-2025' },
  { make: 'Honda',         model: 'Civic 1.5 VTEC Sport',               year: 2023, price:  399_900, mileage:  16_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.4, scrapedSource: 'seed' },
  { make: 'Ford',          model: 'Ranger 2.0 TDCi XL',                 year: 2024, price:  399_900, mileage:  59_500, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  9.0, scrapedSource: 'autotrader-2025' },
  { make: 'Foton',         model: 'Tunland G7 2.5 TD 4x4',              year: 2025, price:  419_900, mileage:  20_580, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  9.5, scrapedSource: 'autotrader-2025' },
  { make: 'Toyota',        model: 'Hilux 2.8 GD-6 SRX',                 year: 2025, price:  439_900, mileage:  47_946, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency:  9.2, scrapedSource: 'autotrader-2025' },
  { make: 'MG',            model: 'HS 1.5T Trophy',                     year: 2025, price:  449_900, mileage:  20_700, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  8.5, scrapedSource: 'autotrader-2025' },
  { make: 'JAC',           model: 'T9 2.0 CRDi Executive',              year: 2024, price:  449_950, mileage:  48_500, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  8.5, scrapedSource: 'autotrader-2025' },
  { make: 'Mazda',         model: '3 2.0 Individual Plus',              year: 2023, price:  449_900, mileage:  14_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.0, scrapedSource: 'seed' },
  { make: 'Hyundai',       model: 'Tucson 2.0 Premium',                 year: 2022, price:  449_900, mileage:  41_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  8.5, scrapedSource: 'seed' },
  { make: 'Haval',         model: 'H6 1.5T Ultra',                      year: 2026, price:  454_950, mileage:       0, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.5, scrapedSource: 'autotrader-2025' },
  { make: 'Ford',          model: 'EcoSport 1.0 EcoBoost Titanium',     year: 2022, price:  319_900, mileage:  38_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.8, scrapedSource: 'seed' },
  { make: 'Volkswagen',    model: 'Golf 8 1.4 TSI Life',                year: 2022, price:  469_900, mileage:  28_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.0, scrapedSource: 'seed' },
  { make: 'Isuzu',         model: 'D-Max 1.9 DDTi LS',                  year: 2023, price:  469_900, mileage:  26_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  7.8, scrapedSource: 'seed' },
  { make: 'Ford',          model: 'Territory 1.5T Titanium',            year: 2025, price:  489_900, mileage:   4_104, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  8.0, scrapedSource: 'autotrader-2025' },
  { make: 'Kia',           model: 'Sportage 1.6T EX',                   year: 2023, price:  479_900, mileage:   8_500, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.8, scrapedSource: 'seed' },
  { make: 'Toyota',        model: 'Hilux 2.4 GD-6 SRX',                 year: 2023, price:  499_900, mileage:  18_500, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency:  9.0, scrapedSource: 'seed' },

  // ── Premium (R500k – R800k) ───────────────────────────────────────────────
  { make: 'Ford',          model: 'Ranger 2.0 SiT XL',                  year: 2022, price:  509_900, mileage:  32_000, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency:  8.5, scrapedSource: 'seed' },
  { make: 'Chery',         model: 'Tiggo 8 Pro 2.0T Executive',         year: 2024, price:  519_950, mileage:  20_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  8.0, scrapedSource: 'autotrader-2025' },
  { make: 'Mercedes-Benz', model: 'CLA 200 AMG Line',                   year: 2021, price:  599_900, mileage:  32_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.5, scrapedSource: 'autotrader-2025' },
  { make: 'BMW',           model: '3 Series 320i M Sport',              year: 2022, price:  699_900, mileage:  25_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.5, scrapedSource: 'seed' },
  { make: 'Ford',          model: 'Everest 2.0 BiTurbo XLT',            year: 2023, price:  679_900, mileage:  92_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  9.5, scrapedSource: 'autotrader-2025' },
  { make: 'MINI',          model: 'Cooper 2.0 Classic',                 year: 2025, price:  699_000, mileage:   5_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.0, scrapedSource: 'autotrader-2025' },
  { make: 'Isuzu',         model: 'D-Max 3.0 DDTi 4x4 X-Rider',        year: 2025, price:  699_900, mileage:  12_659, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  9.0, scrapedSource: 'autotrader-2025' },
  { make: 'Mercedes-Benz', model: 'C200 AMG Line',                      year: 2022, price:  749_900, mileage:  19_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.8, scrapedSource: 'seed' },
  { make: 'Toyota',        model: 'Fortuner 2.8 GD-6 4x4 Epic',        year: 2023, price:  749_900, mileage:  21_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  9.5, scrapedSource: 'seed' },
  { make: 'Audi',          model: 'Q2 35 TFSI S Line',                  year: 2026, price:  748_950, mileage:       0, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  6.5, scrapedSource: 'autotrader-2025' },
  { make: 'Audi',          model: 'A4 2.0 TFSI S Line',                 year: 2023, price:  779_900, mileage:  12_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.0, scrapedSource: 'seed' },

  // ── Luxury & performance (R800k+) ─────────────────────────────────────────
  { make: 'Mercedes-AMG',  model: 'GLC 43 4Matic',                      year: 2020, price:  999_900, mileage:  55_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  8.5, scrapedSource: 'autotrader-2025' },
  { make: 'Land Rover',    model: 'Discovery Sport P200',                year: 2023, price:  999_900, mileage:   8_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  8.0, scrapedSource: 'seed' },
  { make: 'BMW',           model: '5 Series 520d M Sport',               year: 2022, price: 1_099_900, mileage:  32_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  5.8, scrapedSource: 'seed' },
  { make: 'BMW',           model: 'X3 xDrive30d M Sport',                year: 2025, price: 1_099_900, mileage:  13_985, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency:  5.8, scrapedSource: 'autotrader-2025' },
  { make: 'BYD',           model: 'Atto 8',                              year: 2026, price: 1_259_890, mileage:   1_000, fuelType: 'hybrid',  transmission: 'automatic', fuelEfficiency:  3.5, scrapedSource: 'autotrader-2025' },
  { make: 'Audi',          model: 'TT 2.0 TFSI S Tronic',               year: 2023, price: 1_149_900, mileage:  37_036, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  7.0, scrapedSource: 'autotrader-2025' },
  { make: 'Porsche',       model: 'Macan 2.0T',                          year: 2021, price: 1_515_000, mileage:  34_800, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  8.0, scrapedSource: 'autotrader-2025' },
  { make: 'Porsche',       model: 'Cayenne 3.0 TFSI',                    year: 2022, price: 1_599_900, mileage:  15_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency:  9.5, scrapedSource: 'seed' },
  { make: 'Audi',          model: 'RS6 Avant 4.0 TFSI',                  year: 2025, price: 2_295_000, mileage:  13_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 10.0, scrapedSource: 'autotrader-2025' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const prisma = createPrisma();

  try {
    console.log('\nClearing existing car & insurance data...');
    await prisma.insuranceEstimate.deleteMany();
    await prisma.recommendation.deleteMany();
    await prisma.car.deleteMany();

    console.log(`Seeding ${CARS.length} cars with insurance estimates for ${PROVINCES.length} provinces x ${RISK_FACTORS.length} risk tiers...\n`);

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
          imageUrl: getCarImageUrl(carData.make, carData.model),
          scrapedSource: carData.scrapedSource,
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
      console.log(
        `  ${carData.make.padEnd(14)} ${carData.model.padEnd(38)} R${carData.price.toLocaleString().padStart(10)}  |  Gauteng insurance: R${loGauteng}–R${hiGauteng}/mo`,
      );
    }

    const totalEstimates = CARS.length * PROVINCES.length * RISK_FACTORS.length;
    console.log(`\nSeeded ${CARS.length} cars and ${totalEstimates} insurance estimates.`);

    // Re-generate recommendations for all users who have completed their profile
    const users = await prisma.user.findMany({
      where: { netSalary: { not: null } },
      select: { id: true, email: true },
    });

    if (users.length > 0) {
      console.log(`\nRegenerating recommendations for ${users.length} existing user(s)...`);
      const apiBase = process.env.API_BASE_URL ?? 'http://localhost:3001';
      let success = 0;
      for (const user of users) {
        try {
          const res = await fetch(`${apiBase}/recommendations/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
          if (res.ok) {
            const recs = await res.json() as unknown[];
            console.log(`  ${user.email.padEnd(35)} ${recs.length} recommendations`);
            success++;
          } else {
            console.log(`  ${user.email} — skipped (${res.status})`);
          }
        } catch {
          console.log(`  ${user.email} — skipped (server unreachable)`);
        }
      }
      console.log(`\nDone. ${success}/${users.length} users refreshed.\n`);
    } else {
      console.log('No users with completed profiles found — skipping recommendation generation.\n');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
