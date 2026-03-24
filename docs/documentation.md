# FirstCarAI API Documentation

## Overview

FirstCarAI is a REST API that helps users determine which cars they can realistically afford based on their financial situation. Users provide their financial profile and car preferences, and the system scores every car in the database against their affordability and preferences to return a ranked list of recommendations.

**Built with:** NestJS · TypeScript · Prisma ORM · PostgreSQL (Supabase)

---

## Getting Started

### Prerequisites
- Node.js
- A PostgreSQL database (Supabase recommended)

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Installation & Running

```bash
npm install               # Install dependencies
npx prisma generate       # Generate Prisma client
npm run start:dev         # Start with hot-reload (development)
npm run build             # Compile TypeScript
npm run start:prod        # Run compiled build (production)
```

The API runs on port `3000` by default. Override with the `PORT` environment variable.

---

## Database Schema

The database has six tables managed via Prisma ORM.

### users
Stores the financial profile of each user.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| email | String | Unique email address |
| net_salary | Decimal | Monthly net salary |
| credit_score | Integer | Credit score (used to determine loan interest rate) |
| years_licensed | Integer | Years the user has held a driver's licence |
| gender | String | Optional |
| location | String | Used to match insurance estimates by region |
| created_at | Timestamp | Record creation time |

### cars
Stores car listings, typically populated via scraping jobs.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| make | String | Car brand (e.g. Toyota) |
| model | String | Car model (e.g. Corolla) |
| year | Integer | Manufacturing year |
| price | Decimal | Asking price |
| mileage | Integer | Odometer reading (km) |
| fuel_type | String | petrol / diesel / electric / hybrid |
| transmission | String | manual / automatic |
| scraped_source | String | Source URL or platform |
| created_at | Timestamp | Record creation time |

### recommendations
Stores generated recommendations linking a user to a car, including the full cost breakdown and score.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| car_id | UUID | FK → cars |
| estimated_monthly_cost | Decimal | Total monthly ownership cost |
| insurance_cost | Decimal | Monthly insurance component |
| loan_cost | Decimal | Monthly loan repayment component |
| maintenance_cost | Decimal | Monthly maintenance component |
| fuel_cost | Decimal | Monthly fuel component |
| score | Decimal | Final recommendation score (0–1) |
| created_at | Timestamp | Record creation time |

### insurance_estimates
Stores insurance cost estimates per car per location/risk category.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| car_id | UUID | FK → cars |
| location | String | Region the estimate applies to |
| risk_category | String | Risk tier (e.g. low / medium / high) |
| estimated_monthly | Decimal | Estimated monthly premium |
| created_at | Timestamp | Record creation time |

### user_preferences
Stores optional car preferences for a user, used as a scoring bonus.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| preferred_brand | String | Preferred car make |
| car_type | String | Preferred body type (e.g. SUV, sedan) |
| fuel_type | String | Preferred fuel type |
| transmission | String | Preferred transmission type |
| created_at | Timestamp | Record creation time |

### scraping_jobs
Tracks the status of automated car data scraping operations.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| source | String | Data source name or URL |
| records_added | Integer | Number of car records added |
| status | String | pending / running / completed / failed |
| started_at | Timestamp | Job start time |
| completed_at | Timestamp | Job completion time |

---

## API Reference

Base URL: `http://localhost:3000`

---

### Users

#### Create a User
```
POST /users
```

**Request body:**
```json
{
  "email": "john@example.com",
  "netSalary": 25000,
  "creditScore": 720,
  "yearsLicensed": 3,
  "gender": "male",
  "location": "Cape Town"
}
```

**Response:** The created user object.

---

#### Get a User
```
GET /users/:id
```

Returns the user and their preferences.

**Response:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "netSalary": "25000",
  "creditScore": 720,
  "location": "Cape Town",
  "preferences": [...]
}
```

---

#### Set User Preferences
```
POST /users/:id/preferences
```

Creates or updates the user's car preferences.

**Request body:**
```json
{
  "preferredBrand": "Toyota",
  "carType": "sedan",
  "fuelType": "petrol",
  "transmission": "automatic"
}
```

**Response:** The created or updated preference object.

---

### Cars

#### List All Cars
```
GET /cars
```

Optional query parameters for filtering:

| Parameter | Description | Example |
|---|---|---|
| `make` | Filter by brand (partial match) | `?make=toyota` |
| `fuelType` | Filter by fuel type (exact) | `?fuelType=diesel` |
| `transmission` | Filter by transmission (exact) | `?transmission=automatic` |

**Example:** `GET /cars?make=toyota&fuelType=petrol`

---

#### Get a Single Car
```
GET /cars/:id
```

Returns the car and all its insurance estimates.

---

### Recommendations

#### Generate Recommendations
```
POST /recommendations/generate
```

Runs the scoring algorithm for a user against all cars in the database. Clears any previous recommendations for that user and saves the new top 10.

**Request body:**
```json
{
  "userId": "uuid"
}
```

**Requirements:** The user must have `netSalary` and `creditScore` set.

**Response:** Array of up to 10 recommendation objects, each containing:
```json
{
  "id": "uuid",
  "score": "0.74",
  "estimatedMonthlyCost": "4821.50",
  "loanCost": "2650.00",
  "insuranceCost": "950.00",
  "fuelCost": "1500.00",
  "maintenanceCost": "600.00",
  "car": {
    "make": "Toyota",
    "model": "Corolla",
    "year": 2021,
    "price": "145000"
  }
}
```

---

#### Get Saved Recommendations
```
GET /recommendations/user/:userId
```

Returns the previously generated and saved recommendations for a user, ordered by score descending.

---

## Recommendation Algorithm

When `POST /recommendations/generate` is called, the following steps are performed for every car in the database that has a price:

### Step 1 — Loan Cost
Monthly repayment is calculated using the standard loan amortisation formula:

```
M = P × [r(1+r)^n] / [(1+r)^n - 1]
```

- `P` = car price
- `n` = 60 months (5-year loan term)
- `r` = monthly interest rate, derived from the user's credit score:

| Credit Score | Annual Interest Rate |
|---|---|
| 750 and above | 5% |
| 700 – 749 | 7% |
| 650 – 699 | 10% |
| 600 – 649 | 13% |
| Below 600 | 16% |

### Step 2 — Insurance Cost
The system looks for an `InsuranceEstimate` record matching the car and the user's location. If none is found, it falls back to the average of all insurance estimates for that car. If no estimates exist at all, a default of R800/month is used.

### Step 3 — Fuel Cost
A flat monthly estimate based on the car's fuel type:

| Fuel Type | Monthly Estimate |
|---|---|
| Petrol | R1,500 |
| Diesel | R1,300 |
| Hybrid | R900 |
| Electric | R500 |
| Unknown | R1,200 |

### Step 4 — Maintenance Cost
Estimated from the car's age and mileage:

| Condition | Amount |
|---|---|
| Base cost | R600 |
| Car older than 5 years | +R400 |
| Mileage above 100,000 km | +R500 |

### Step 5 — Affordability Filter
A car is excluded if its total monthly cost exceeds **30% of the user's net salary**:

```
totalMonthlyCost / netSalary > 0.30  →  excluded
```

### Step 6 — Scoring
Each remaining car is scored on two dimensions:

**Affordability score** — how much salary remains after ownership costs:
```
affordabilityScore = 1 - (totalMonthlyCost / netSalary)
```

**Preference score** — how many of the user's preferences match the car (0–3 points):
- +1 if `preferredBrand` matches the car's make
- +1 if `fuelType` preference matches
- +1 if `transmission` preference matches

**Final score** (weighted combination):
```
finalScore = (affordabilityScore × 0.70) + ((preferenceScore / 4) × 0.30)
```

Affordability carries 70% of the weight; preference match carries 30%.

### Step 7 — Output
Cars are sorted by `finalScore` descending. The top 10 are saved to the `recommendations` table and returned in the response.

---

## Module Structure

```
src/
├── app.module.ts                        Root module
├── modules/
│   ├── prisma/                          Database connection (global)
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── users/                           User CRUD + preferences
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── create-preference.dto.ts
│   ├── cars/                            Car listing + filtering
│   │   ├── cars.module.ts
│   │   ├── cars.controller.ts
│   │   └── cars.service.ts
│   └── recommendations/                 Scoring engine
│       ├── recommendations.module.ts
│       ├── recommendations.controller.ts
│       ├── recommendations.service.ts
│       └── dto/
│           └── generate-recommendation.dto.ts
prisma/
└── schema.prisma                        Database schema
```

---

## Development Commands

```bash
npm run start:dev       # Run with hot-reload
npm run build           # Compile TypeScript
npm run test            # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:cov        # Generate coverage report
npm run lint            # Lint and auto-fix
npx prisma generate     # Regenerate Prisma client after schema changes
npx prisma db pull      # Pull schema from live database
npx prisma studio       # Open database browser GUI
```
