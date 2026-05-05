import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter } as any);
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

// ── Car catalogue (scraped from AutoTrader South Africa, May 2025) ────────────
// imageId → https://img.autotrader.co.za/{imageId}  (public CDN, no auth required)
const CARS = [

  // ── Budget hatchbacks & city cars (< R200k) ───────────────────────────────
  { make: 'Hyundai',       model: 'Grand i10 1.25 Fluid',                year: 2017, price:  109_900, mileage: 177_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.1,  imageId: 46830927 },
  { make: 'Nissan',        model: 'Almera 1.5 Acenta',                   year: 2021, price:  119_900, mileage:  97_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.5,  imageId: 46872689 },
  { make: 'Ford',          model: 'Figo Hatch 1.5 Trend',                year: 2019, price:  134_999, mileage:  94_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.8,  imageId: 45236972 },
  { make: 'Renault',       model: 'Kwid 1.0',                            year: 2021, price:  149_950, mileage:  85_749, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 5.2,  imageId: 43939623 },
  { make: 'Hyundai',       model: 'i20 1.2 Motion',                      year: 2018, price:  159_900, mileage:  90_150, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.0,  imageId: 46150346 },
  { make: 'Ford',          model: 'Fiesta 5-Door 1.0T Trend',            year: 2018, price:  169_900, mileage:  54_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.0,  imageId: 46725825 },
  { make: 'Nissan',        model: 'Almera 1.5 Acenta',                   year: 2020, price:  169_900, mileage:  93_704, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.5,  imageId: 46707421 },
  { make: 'Kia',           model: 'Rio Hatch 1.4 Tec',                   year: 2018, price:  169_900, mileage: 160_800, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.2,  imageId: 46862121 },
  { make: 'Volkswagen',    model: 'Polo Vivo Hatch 1.4 Comfortline',     year: 2021, price:  179_900, mileage: 159_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.8,  imageId: 43675521 },
  { make: 'BMW',           model: '1 Series 120i 5-Door',                year: 2018, price:  179_900, mileage: 168_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.2,  imageId: 42388583 },
  { make: 'Volkswagen',    model: 'Polo Sedan 1.4 Comfortline',          year: 2021, price:  179_900, mileage: 181_571, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.8,  imageId: 46831501 },
  { make: 'Hyundai',       model: 'Atos 1.1 Motion Auto',                year: 2023, price:  189_700, mileage:  29_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 5.5,  imageId: 46161028 },
  { make: 'Kia',           model: 'Rio Hatch 1.4 Tec',                   year: 2016, price:  189_900, mileage: 117_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.2,  imageId: 46827246 },
  { make: 'Hyundai',       model: 'Grand i10 1.0 Motion Hatch',          year: 2023, price:  189_950, mileage:  33_903, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 5.8,  imageId: 46835648 },
  { make: 'Nissan',        model: 'Magnite 1.0 Turbo Visia',             year: 2024, price:  199_900, mileage:  19_300, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.2,  imageId: 46872987 },

  // ── Mid-range hatchbacks & crossovers (R200k – R380k) ────────────────────
  { make: 'Hyundai',       model: 'Grand i10 1.0 Motion Hatch',          year: 2025, price:  205_400, mileage:  33_166, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 5.8,  imageId: 46834571 },
  { make: 'Hyundai',       model: 'Venue 1.0T Fluid',                    year: 2021, price:  209_900, mileage:  96_365, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.5,  imageId: 45360296 },
  { make: 'Nissan',        model: 'Magnite 1.0 Acenta Auto',             year: 2024, price:  209_900, mileage:  31_700, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.5,  imageId: 46855095 },
  { make: 'Suzuki',        model: 'Swift 1.2 GL Auto',                   year: 2024, price:  214_500, mileage:  16_500, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 5.8,  imageId: 46641361 },
  { make: 'Toyota',        model: 'Vitz 1.0',                            year: 2026, price:  219_950, mileage:     117, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 5.5,  imageId: 45924150 },
  { make: 'Nissan',        model: 'Magnite 1.0 Acenta Manual',           year: 2025, price:  219_900, mileage:  16_300, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.2,  imageId: 46858474 },
  { make: 'Ford',          model: 'EcoSport 1.0T Trend',                 year: 2022, price:  219_900, mileage:  44_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.5,  imageId: 45134455 },
  { make: 'Suzuki',        model: 'Ignis 1.2 GLX Manual',                year: 2023, price:  225_900, mileage:  42_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 5.8,  imageId: 46870847 },
  { make: 'Suzuki',        model: 'Swift 1.2 GL+ Auto',                  year: 2025, price:  229_900, mileage:  35_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 5.8,  imageId: 46829823 },
  { make: 'Ford',          model: 'Ranger 2.2TDCi Hi-Rider XL',          year: 2022, price:  229_990, mileage: 185_000, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency: 9.5,  imageId: 46835996 },
  { make: 'Volkswagen',    model: 'Polo Hatch 1.0TSI Comfortline',       year: 2021, price:  239_900, mileage:  75_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.4,  imageId: 45802621 },
  { make: 'Kia',           model: 'Rio Hatch 1.2 LS',                    year: 2023, price:  239_900, mileage:  24_500, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 5.9,  imageId: 46830712 },
  { make: 'Kia',           model: 'Sonet 1.5 EX Auto',                   year: 2022, price:  239_900, mileage:  45_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.8,  imageId: 46832156 },
  { make: 'MINI',          model: 'Clubman Cooper Auto',                  year: 2019, price:  259_900, mileage: 111_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.0,  imageId: 46639059 },
  { make: 'Suzuki',        model: 'Vitara Brezza 1.5 GLX Auto',          year: 2023, price:  259_900, mileage:  74_412, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.5,  imageId: 46827350 },
  { make: 'Hyundai',       model: 'Kona 1.0T Executive',                 year: 2020, price:  259_900, mileage:  75_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.9,  imageId: 46797195 },
  { make: 'Hyundai',       model: 'Exter 1.2 Executive Manual',          year: 2026, price:  264_900, mileage:       0, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.0,  imageId: 46528741 },
  { make: 'Volkswagen',    model: 'Polo Hatch 1.0TSI 70kW',              year: 2024, price:  264_900, mileage:  52_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.4,  imageId: 46872707 },
  { make: 'MG',            model: 'MG3 1.5 Comfort Auto',                year: 2026, price:  269_890, mileage:   1_501, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.5,  imageId: 41231194 },
  { make: 'Peugeot',       model: '2008 1.2T Active Auto',               year: 2024, price:  279_900, mileage:  30_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.3,  imageId: 46844576 },
  { make: 'Chery',         model: 'Tiggo 7 Pro 1.5T Comfort',            year: 2022, price:  279_900, mileage: 101_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.2,  imageId: 46259334 },
  { make: 'Kia',           model: 'Seltos 1.4T-GDI GT Line Auto',        year: 2022, price:  284_990, mileage:  87_157, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.5,  imageId: 46743488 },
  { make: 'Kia',           model: 'Sportage 1.6GDI Ignite Auto',         year: 2022, price:  289_900, mileage:  50_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.8,  imageId: 46800993 },
  { make: 'Suzuki',        model: 'Fronx 1.5 GL Manual',                 year: 2026, price:  293_900, mileage:       0, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 6.2,  imageId: 46311367 },
  { make: 'Toyota',        model: 'Starlet Cross 1.5 XS Auto',           year: 2025, price:  299_890, mileage:  28_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.5,  imageId: 46426844 },
  { make: 'Toyota',        model: 'RAV4 2.0 GX Manual',                  year: 2021, price:  299_900, mileage:  84_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 8.2,  imageId: 45167161 },
  { make: 'Hyundai',       model: 'Tucson 2.0 Premium Manual',           year: 2020, price:  299_900, mileage:  97_857, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 8.5,  imageId: 46823219 },
  { make: 'Kia',           model: 'Seltos 1.6 EX Manual',                year: 2023, price:  299_900, mileage:  67_877, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 7.5,  imageId: 46812233 },
  { make: 'Suzuki',        model: 'Ertiga 1.5 GA Manual',                year: 2024, price:  309_950, mileage:  55_000, fuelType: 'petrol',  transmission: 'manual',    fuelEfficiency: 7.5,  imageId: 46830082 },
  { make: 'Toyota',        model: 'Urban Cruiser 1.5 XR Auto',           year: 2025, price:  314_900, mileage:  40_264, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.8,  imageId: 46864241 },
  { make: 'Kia',           model: 'Sonet 1.5 LX Auto',                   year: 2024, price:  319_500, mileage:  28_652, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.8,  imageId: 46812687 },
  { make: 'Kia',           model: 'Seltos 1.5CRDi EX Auto',              year: 2022, price:  324_900, mileage:  41_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 6.0,  imageId: 46874477 },
  { make: 'Volkswagen',    model: 'Polo Vivo Hatch 1.6 Life Tiptronic',  year: 2026, price:  326_800, mileage:   1_500, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.2,  imageId: 46680393 },
  { make: 'Nissan',        model: 'Navara 2.5DDTi Double Cab SE',        year: 2023, price:  349_900, mileage: 131_500, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency: 9.5,  imageId: 46286753 },
  { make: 'Volkswagen',    model: 'Polo Hatch 1.0TSI 85kW Life Auto',    year: 2024, price:  349_890, mileage:  15_700, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.4,  imageId: 46249182 },
  { make: 'MINI',          model: 'Hatch Cooper Auto',                   year: 2020, price:  349_900, mileage:  14_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.8,  imageId: 46638386 },
  { make: 'Suzuki',        model: 'Grand Vitara 1.5 GL Auto',            year: 2026, price:  351_900, mileage:       0, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.0,  imageId: 46855449 },
  { make: 'Toyota',        model: 'Corolla Hatch 1.8 Hybrid XS',        year: 2025, price:  369_800, mileage:  33_456, fuelType: 'hybrid',  transmission: 'automatic', fuelEfficiency: 4.5,  imageId: 46862071 },
  { make: 'Suzuki',        model: 'Jimny 1.5 GLX Allgrip 5-Door Auto',  year: 2024, price:  369_900, mileage:  54_912, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.2,  imageId: 46864275 },
  { make: 'Mercedes-Benz', model: 'GLC 220d 4Matic',                    year: 2018, price:  379_900, mileage: 112_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 7.5,  imageId: 46844420 },
  { make: 'Toyota',        model: 'RAV4 2.0 GX Auto',                   year: 2021, price:  379_995, mileage:  44_500, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.2,  imageId: 46814118 },
  { make: 'Volkswagen',    model: 'Tiguan 2.0TDI 4Motion Highline',     year: 2019, price:  389_900, mileage: 104_472, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 7.5,  imageId: 39892553 },

  // ── Mid-upper: SUVs, bakkies & hot hatches (R390k – R680k) ───────────────
  { make: 'Volkswagen',    model: 'Amarok 2.0TDI Single Cab 4Motion',   year: 2023, price:  399_900, mileage:  96_000, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency: 9.5,  imageId: 45359301 },
  { make: 'BMW',           model: '1 Series 118i M Sport',              year: 2022, price:  399_950, mileage: 100_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.5,  imageId: 46862045 },
  { make: 'Ford',          model: 'Ranger 2.0 SiT Double Cab XL Auto',  year: 2023, price:  398_500, mileage: 159_026, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 9.0,  imageId: 46822699 },
  { make: 'Ford',          model: 'PUMA 1.0T ST-Line Vignale Auto',     year: 2025, price:  398_500, mileage:   2_351, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 5.8,  imageId: 46810549 },
  { make: 'Foton',         model: 'Tunland G7 2.5TD Auto',              year: 2025, price:  419_900, mileage:  20_580, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 10.5, imageId: 46843705 },
  { make: 'Toyota',        model: 'Hilux 2.4GD-6 Xtra Cab Raider',     year: 2023, price:  429_900, mileage: 152_092, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency: 9.5,  imageId: 46633298 },
  { make: 'Hyundai',       model: 'Tucson 2.0 Elite Auto',              year: 2022, price:  439_900, mileage:  27_653, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.5,  imageId: 46683140 },
  { make: 'Toyota',        model: 'Hilux 2.4GD-6 Single Cab 4x4 SR',   year: 2025, price:  439_900, mileage:  47_946, fuelType: 'diesel',  transmission: 'manual',    fuelEfficiency: 9.5,  imageId: 46871418 },
  { make: 'JAC',           model: 'T9 2.0CRDi Executive Auto',          year: 2024, price:  449_950, mileage:  48_500, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 10.0, imageId: 43189636 },
  { make: 'Toyota',        model: 'Corolla Cross 2.0 XS Hybrid Auto',   year: 2026, price:  449_999, mileage:   5_000, fuelType: 'hybrid',  transmission: 'automatic', fuelEfficiency: 4.8,  imageId: 46168490 },
  { make: 'BMW',           model: '3 Series 318i M Sport Auto',         year: 2021, price:  449_900, mileage: 102_598, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.0,  imageId: 46772880 },
  { make: 'Ford',          model: 'Territory 1.8T Trend Auto',          year: 2025, price:  489_900, mileage:   4_104, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.5,  imageId: 46843688 },
  { make: 'Volkswagen',    model: 'T-Roc 2.0TSI 4Motion R-Line Auto',   year: 2023, price:  499_000, mileage:  61_687, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.0,  imageId: 46866493 },
  { make: 'Kia',           model: 'Sorento 2.2CRDi EX+ Auto',           year: 2022, price:  499_900, mileage:  64_899, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 7.5,  imageId: 46855698 },
  { make: 'Chery',         model: 'Tiggo 8 Pro 2.0T Executive Auto',    year: 2024, price:  519_950, mileage:  20_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.0,  imageId: 46837763 },
  { make: 'Toyota',        model: 'Fortuner 2.4GD-6 4x4 Auto',         year: 2023, price:  549_900, mileage:  77_007, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 9.0,  imageId: 46849148 },
  { make: 'Kia',           model: 'Sportage 1.6T-GDi GT Line Plus Auto',year: 2024, price:  549_900, mileage:  10_440, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 7.8,  imageId: 46862167 },
  { make: 'Ford',          model: 'Ranger 2.0 SiT Double Cab XLT Auto', year: 2025, price:  569_900, mileage:   4_994, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 9.0,  imageId: 43099038 },
  { make: 'Ford',          model: 'Territory 1.8T Dark Edition Auto',   year: 2025, price:  579_900, mileage:   8_500, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.5,  imageId: 46854062 },
  { make: 'Ford',          model: 'Ranger 2.0 Biturbo Wildtrak Auto',   year: 2026, price:  599_900, mileage:     650, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 9.5,  imageId: 46745360 },
  { make: 'Toyota',        model: 'RAV4 2.0 VX Auto',                   year: 2025, price:  609_900, mileage:   8_377, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.2,  imageId: 46860509 },
  { make: 'MINI',          model: 'Cooper 2.0 Classic Auto',            year: 2024, price:  629_900, mileage:   7_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 6.0,  imageId: 46865254 },
  { make: 'Volkswagen',    model: 'Amarok 2.0BITDI Double Cab Style',   year: 2024, price:  670_000, mileage:  39_100, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 9.0,  imageId: 46837014 },
  { make: 'Toyota',        model: 'Fortuner 2.8GD-6 VX Auto',           year: 2024, price:  679_900, mileage:  24_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 9.0,  imageId: 46861154 },
  { make: 'BMW',           model: '1 Series M135i xDrive Auto',         year: 2022, price:  679_900, mileage:  49_147, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.5,  imageId: 46838619 },

  // ── Premium & performance (R700k+) ────────────────────────────────────────
  { make: 'BMW',           model: 'X3 xDrive20d M Sport Auto',          year: 2023, price:  749_000, mileage:  53_000, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 7.5,  imageId: 46864947 },
  { make: 'Kia',           model: 'Carnival 2.2CRDi SXL Auto',          year: 2022, price:  758_950, mileage:  69_994, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 8.5,  imageId: 46838944 },
  { make: 'Ford',          model: 'Ranger 3.0TD V6 Wildtrak 4WD Auto',  year: 2024, price:  769_900, mileage:  55_272, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 11.0, imageId: 46859716 },
  { make: 'Toyota',        model: 'Hilux 2.8GD-6 4x4 Legend Auto',      year: 2025, price:  789_900, mileage:  26_528, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 10.0, imageId: 46856884 },
  { make: 'BMW',           model: '3 Series 320i M Sport Auto',          year: 2025, price:  819_000, mileage:  19_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 8.5,  imageId: 46796585 },
  { make: 'Ford',          model: 'Ranger 3.0 V6 Raptor 4WD Auto',      year: 2023, price:  819_900, mileage: 117_100, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 11.5, imageId: 46857214 },
  { make: 'Ford',          model: 'Ranger 2.0 Biturbo Wildtrak X 4WD',  year: 2025, price:  848_500, mileage:  26_107, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 9.5,  imageId: 46811464 },
  { make: 'BMW',           model: 'M4 Coupe Competition Auto',           year: 2018, price:  899_000, mileage:  51_211, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 10.8, imageId: 46771659 },
  { make: 'BMW',           model: 'M5 Standard Edition Auto',            year: 2018, price:  949_900, mileage:  69_452, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 12.0, imageId: 46813895 },
  { make: 'Mercedes-AMG',  model: 'GLC 43 4Matic Auto',                 year: 2020, price:  999_900, mileage:  55_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 10.5, imageId: 46869147 },
  { make: 'BMW',           model: 'X3 20d xDrive M Sport Auto',          year: 2025, price: 1_099_900, mileage:  13_985, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 7.5,  imageId: 46867093 },
  { make: 'BMW',           model: 'X3 20d xDrive M Sport Auto',          year: 2026, price: 1_299_900, mileage:   1_050, fuelType: 'diesel',  transmission: 'automatic', fuelEfficiency: 7.5,  imageId: 46264900 },
  { make: 'Audi',          model: 'RS4 Avant 2.9 TFSI Auto',            year: 2024, price: 1_549_990, mileage:  11_700, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 11.0, imageId: 46254700 },
  { make: 'BMW',           model: 'X5 M Competition Auto',               year: 2022, price: 1_799_000, mileage:  46_000, fuelType: 'petrol',  transmission: 'automatic', fuelEfficiency: 12.0, imageId: 46842763 },
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
      const imageUrl = `https://img.autotrader.co.za/${carData.imageId}`;

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
          imageUrl,
          scrapedSource: 'autotrader-2025',
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
        `  ${carData.make.padEnd(14)} ${carData.model.padEnd(42)} R${carData.price.toLocaleString().padStart(10)}  |  Gauteng: R${loGauteng}–R${hiGauteng}/mo`,
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
          console.log(`  ${user.email} — skipped (API unreachable)`);
        }
      }
      console.log(`Done. ${success}/${users.length} users refreshed.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
