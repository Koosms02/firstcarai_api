# FirstCarAI — Complete Project Guide

A South African car recommendation web app that helps first-time buyers find a car they can realistically afford based on their income, expenses, and preferences.

---

## Table of Contents

1. [What the App Does](#1-what-the-app-does)
2. [How the Two Parts Work Together](#2-how-the-two-parts-work-together)
3. [Setting Up the Project](#3-setting-up-the-project)
4. [Frontend — Page by Page](#4-frontend--page-by-page)
5. [Backend — Endpoint by Endpoint](#5-backend--endpoint-by-endpoint)
6. [The AI Systems](#6-the-ai-systems)
7. [The Database](#7-the-database)
8. [How Data Flows Through the App](#8-how-data-flows-through-the-app)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Third-Party Services](#10-third-party-services)
11. [Known Issues & Things to Fix Before Going Live](#11-known-issues--things-to-fix-before-going-live)

---

## 1. What the App Does

FirstCarAI walks a user through four stages:

| Stage | What Happens |
|---|---|
| **Sign up / Log in** | User creates an account or logs in. Guest mode is also supported — no account needed. |
| **Questionnaire** | 16 questions about income, expenses, and car preferences. |
| **Recommendations** | AI searches the internet for real cars the user can afford and returns 5 results with full monthly cost breakdowns. |
| **Dashboard** | User views their cars, selects a favourite, and chats with an AI advisor about deposit, commute costs, fuel, and more. |

The monthly budget rule is simple: **a car should cost no more than 20% of your net salary per month** (loan + insurance + fuel + maintenance combined).

---

## 2. How the Two Parts Work Together

```
User's Browser
      │
      ▼
 Next.js Frontend          ◄──────── sessionStorage (temporary)
 (localhost:3000)           ◄──────── localStorage (persistent)
      │
      │  HTTP requests
      ▼
 NestJS Backend API
 (localhost:3001)
      │
      ├── PostgreSQL database (Supabase)
      ├── OpenAI GPT-4o (AI recommendations + advisor chat)
      ├── Serper.dev (live Google search for real cars)
      └── Gemini / Anthropic (fallback AI providers)
```

The frontend never talks to the database directly. All data goes through the backend API.

---

## 3. Setting Up the Project

### Requirements

- Node.js 18 or later
- npm
- A Supabase account (free tier works)
- An OpenAI API key
- A Serper.dev API key (for live car search)

### Backend Setup

```bash
cd firstcarai_api
npm install
```

Create a `.env` file with these values (see Section 9 for full reference):

```
DATABASE_URL=your_supabase_postgres_url
JWT_SECRET=a_long_random_string
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
SERPER_KEY=your_serper_key
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

```bash
npx prisma generate     # generate the Prisma client
npx prisma db push      # push the schema to your database
npm run start:dev       # start with hot reload
```

### Frontend Setup

```bash
cd firstcar_frontend
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK_DATA=false
OPENAI_API_KEY=your_openai_key
```

```bash
npm run dev     # start at http://localhost:3000
```

### Mock Mode (no backend needed)

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`. All API calls are replaced with local mock data. The backend does not need to be running.

---

## 4. Frontend — Page by Page

The frontend is built with **Next.js 14 App Router**. All pages live under `firstcar_frontend/app/`.

### `/` — Login & Signup (`app/page.tsx`)

One page, three modes that swap in and out:

- **Signup mode**: Creates auth credentials only. No profile is written to the database yet — that only happens after the questionnaire.
- **Login mode**: Checks if the user has completed the questionnaire (`netSalary != null`). If yes, loads their data. If no, sends them to the form.
- **Forgot password mode**: Sends a reset link (currently returned in the API response — see Section 11).
- **Guest mode**: User can skip login entirely and go straight to the form. Their answers are saved in `sessionStorage`.

When a guest later logs in, any questionnaire answers already in `sessionStorage` are automatically submitted to create their profile.

---

### `/form` — The Questionnaire (`app/form/page.tsx`)

16 questions, one at a time, with slide animations. The browser back button navigates between questions.

| # | Question | Type | Notes |
|---|---|---|---|
| 1 | First name | Text | |
| 2 | Last name | Text | |
| 3 | Gender | Choice | Male / Female / Non-binary / Prefer not to say |
| 4 | Province | Choice | All 9 SA provinces |
| 5 | City | Dropdown | Filtered by selected province |
| 6 | Monthly net salary | Currency | Supports payslip file upload (PDF/image) |
| 7 | SA ID number | Text | Validated with Luhn checksum + date parsing |
| 8 | Groceries (monthly) | Currency | |
| 9 | Accounts & subscriptions | Currency | |
| 10 | Loans | Currency | |
| 11 | Other expenses | Currency | |
| 12 | Years licensed | Choice | <1 / 1–3 / 3–5 / 5+ |
| 13 | Preferred brand | Multi-select | 44 brands, searchable |
| 14 | Car type | Choice | Hatchback / Sedan / SUV / Bakkie |
| 15 | Fuel type | Choice | Petrol / Diesel / Hybrid / Electric |
| 16 | Transmission | Choice | Manual / Automatic |

**Keyboard shortcuts**: Letter keys (A/B/C/D) select choice options. Enter moves to the next question.

**Payslip & bank statement uploads**: The app uses AI to extract the net salary from a payslip and categorise expenses from a bank statement. If AI fails, it falls back to regex pattern matching.

**After the form**: The app calls three backend endpoints in order:
1. `/credit-score/check` — calculate a simulated credit score from the DTI ratio
2. `/users` — save or update the user profile
3. `/ai-recommendations/generate` — search the internet and return 5 car recommendations

The user is then redirected to the dashboard.

---

### `/dashboard` — Main App (`app/dashboard/page.tsx`)

Three views accessible from the sidebar: **Dashboard**, **My Profile**, **Search History**.

#### Dashboard View

**Car Recommendations**

Up to 5 cars returned by the AI. Each card shows:
- Make, model, year
- Purchase price
- Car photo (from Serper image search)
- Monthly breakdown: Loan / Insurance / Fuel / Maintenance / **Total**
- Match score (AI-generated, 0–100%)
- Dealer name, location, and reputation note
- "Select as my preferred car" button

Users can filter cards by brand using the filter bar.

**Preferred Car + AI Advisor Chat**

When a user selects a preferred car:
1. The page scrolls automatically to the chat section.
2. The AI advisor sends an opening message acknowledging the car and asking a follow-up question.
3. The user can then have a full conversation.

**What the AI advisor can do from the chat:**
- Answer questions about fuel costs (commute, road trips)
- Calculate deposit needed and adjusted loan repayments
- Suggest ways to cut monthly expenses
- Update the user's expense figures in the app (live — no page refresh needed)
- Update profile details (salary, province)
- Trigger a new car search with updated budget

**Suggested questions** (shown before the user types anything):
- How much will fuel cost for my daily commute?
- What is the fuel cost for a Johannesburg to Cape Town trip?
- How much deposit do I need?
- Help me cut my expenses to afford this car
- Find cheaper cars in my budget

#### My Profile View

Displays all questionnaire answers. An **Edit** button opens every field for editing. Saving runs the full pipeline again — new credit score, new AI car search.

**Credit score ratings:**

| Score | Rating |
|---|---|
| 750–850 | Excellent |
| 700–749 | Very Good |
| 650–699 | Good |
| 600–649 | Fair |
| 300–599 | Poor |

#### Search History View

Every time a car search runs, an entry is written to `localStorage` with the timestamp, budget, filters applied, and how many results came back. The last 50 searches are kept.

---

### `/admin` — Admin Panel (`app/admin/page.tsx`)

A simple table showing all registered users:
- Email, province, gender, salary, credit score
- Delete button with confirmation dialog

No authentication guard is currently applied to this page — see Section 11.

---

### `/r/[email]/[uuid]` — Password Reset (`app/r/[email]/[uuid]/page.tsx`)

The reset link sent via the forgot-password flow looks like:
```
/r/user@example.com/550e8400-e29b-41d4-a716-446655440000
```

The user enters a new password and confirms it. The token is valid for **1 hour**.

---

### `lib/recommendations.ts` — The API Layer

Every frontend API call goes through this one file. Each function:
1. Checks `USE_MOCK_DATA` — if true, returns fake data with a short delay
2. Otherwise, calls the real backend endpoint

**All API functions:**

| Function | Method | Endpoint | What it does |
|---|---|---|---|
| `signup` | POST | `/auth/signup` | Create account, returns JWT |
| `login` | POST | `/auth/signin` | Login, returns JWT |
| `submitQuestionnaire` | POST (multiple) | See above | Credit score → profile → preferences |
| `generateAiRecommendations` | POST | `/ai-recommendations/generate` | AI car search |
| `getUser` | GET | `/users/:id` | Fetch one user |
| `getUsers` | GET | `/users` | Fetch all users (admin) |
| `deleteUser` | DELETE | `/users/:id` | Remove a user |
| `forgotPassword` | POST | `/auth/forgot-password` | Generate reset link |
| `resetPassword` | POST | `/auth/reset-password` | Set new password |
| `analyzeExpenses` | POST | `/analyze-expenses` | Parse bank statement text |

---

## 5. Backend — Endpoint by Endpoint

The backend is a **NestJS** REST API running on port **3001**. Built with a modular structure — each feature is its own module.

### Auth — `/auth`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/signup` | `{email, password}` | `{access_token}` |
| POST | `/auth/signin` | `{email, password}` | `{access_token}` |
| POST | `/auth/forgot-password` | `{email}` | `{resetPath}` |
| POST | `/auth/reset-password` | `{email, token, newPassword}` | `{message}` |

Passwords are hashed with **bcrypt** (10 salt rounds). JWTs contain `{sub: userId, email, role}`.

The forgot-password flow stores a hashed UUID token in the database with a 1-hour expiry. The raw token is returned in the API response (should be emailed instead — see Section 11).

---

### Users — `/users`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/users` | User fields | User (upserts by email) |
| GET | `/users` | — | User[] |
| GET | `/users/:id` | — | User (with preferences) |
| PATCH | `/users/:id` | Partial user fields | Updated user |
| DELETE | `/users/:id` | — | void |
| POST | `/users/:id/preferences` | Preference fields | UserPreference |

The `POST /users` call is an **upsert** — if the email already exists, it updates the profile instead of creating a duplicate.

---

### AI Recommendations — `/ai-recommendations`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/ai-recommendations/generate` | `{userId}` or `{netSalary, creditScore, location, yearsLicensed}` | `Recommendation[]` |

This is the most complex endpoint in the app. See Section 6 for the full explanation.

---

### AI Advisor — `/ai-advisor`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/ai-advisor/chat` | `{messages, financialContext, preferredCar?}` | `{reply, actions[]}` |

The `actions` array contains any changes the AI decided to make. The frontend applies these to its state. See Section 6 for details.

---

### Credit Score — `/credit-score`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/credit-score/check` | `{idNumber, income, expenses}` | `{creditScore, rating, ...}` |
| POST | `/credit-score/mock` | `{idNumber}` | `{creditScore, rating}` |

The credit score is **simulated** (not a real bureau check). It works like this:

1. A base score (500–700) is derived from the digits of the SA ID number.
2. The DTI (debt-to-income) ratio adjusts it:
   - DTI < 20% → +100 points
   - DTI < 40% → +50 points
   - DTI < 60% → no change
   - DTI < 80% → −50 points
   - DTI ≥ 80% → −100 points
3. Final score is capped between 300 and 850.

---

### Analyze Expenses — `/analyze-expenses`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/analyze-expenses` | `{text}` | `{groceries, accounts, loans, other}` |

Accepts raw bank statement text and uses AI to categorise the debits into four buckets. Falls back to regex if AI fails. Text is truncated to 40,000 characters to avoid context limits.

---

## 6. The AI Systems

### Car Recommendation Engine

When a user completes the form, the backend runs a three-step pipeline:

**Step 1 — Generate search queries**

GPT-4o is asked to write 5 targeted Google search queries based on the user's budget and preferences. The prompt asks for a mix of used and new cars:
- 2 queries for used cars in the budget range
- 2 queries for new cars
- 1 query for insurance quotes

Example queries generated:
```
"used Toyota Vitz for sale R80000 Gauteng 2019 2020"
"new Suzuki S-Presso price 2024 South Africa"
"car insurance quote first-time buyer Gauteng R150000 car"
```

**Step 2 — Search the web with Serper.dev**

Each query is sent to the **Serper.dev** Google Search API. Results come back as structured JSON — titles, snippets, links, and prices from real listings. A separate image search runs for each car to fetch a photo.

**Step 3 — Process results into recommendations**

All search results are combined and sent back to GPT-4o with a detailed prompt that instructs it to:
- Pick 5 cars (at least 2 used, at least 2 new)
- Calculate individual monthly costs for each car using real formulas:
  - **Loan**: Standard amortisation formula over 60 months at 13% p.a. (good credit) or 18% p.a. (poor credit)
  - **Insurance**: 1.0–1.5% of car value per month
  - **Fuel**: 1,200 km/month × fuel consumption × R22/litre
  - **Maintenance**: 0.5% of value/year ÷ 12 (new cars), 1.0% (used)
- Assign a reputable SA dealership to each car
- Return a clean JSON array

The `estimatedMonthlyCost` field must equal `loanCost + insuranceCost + fuelCost + maintenanceCost` exactly.

**AI Provider options** (set via `AI_PROVIDER` env var):

| Provider | Model Used | Notes |
|---|---|---|
| `openai` | gpt-4o | Default. Uses Serper for web search. |
| `gemini` | gemini-2.5-flash | Uses Serper if key present, otherwise Google Search grounding. |
| `anthropic` | claude-haiku-4-5 | No web search — uses training data only. |

---

### AI Advisor Chat

The advisor chat on the dashboard uses **OpenAI GPT-4o with function calling (tools)**.

Every message to the advisor includes the user's full financial profile:
- Salary, expenses, disposable income, DTI ratio
- Credit score and province
- If a car is selected: full monthly cost breakdown and whether it fits the budget

**Three tools the AI can call:**

| Tool | What it does | When it triggers |
|---|---|---|
| `update_expenses` | Reduces one or more expense categories | User asks "help me cut costs" |
| `update_profile` | Updates salary, province, or years licensed | User provides new values |
| `search_affordable_cars` | Triggers a new car search | User asks "find cars in my budget" |

**How tool calling works:**

1. User sends a message.
2. Backend calls GPT-4o — the model decides whether to respond in text or call a tool.
3. If a tool is called, the backend executes it and calculates the result (e.g. new monthly budget after expense cuts).
4. The tool result is fed back to GPT-4o for a second call.
5. GPT-4o writes a natural language response explaining what changed.
6. The response arrives at the frontend as `{reply, actions[]}`.
7. The frontend applies the actions to its own state — expense figures update live, car search reruns automatically.

---

## 7. The Database

The database is **PostgreSQL** hosted on **Supabase**, accessed via **Prisma ORM**.

### Tables

**User**
```
id            UUID (primary key)
email         String (unique)
password      String (bcrypt hash)
role          ENUM: USER | ADMIN
fullName      String?
idNumber      String?
netSalary     Float?
creditScore   Int?
yearsLicensed Int?
gender        String?
location      String?
passwordResetToken   String? (bcrypt hash of UUID token)
passwordResetExpiry  DateTime? (1 hour after request)
createdAt     DateTime
```

**Car**
```
id              UUID (primary key)
make            String
model           String
year            Int?
price           Float?
mileage         Int?
fuelType        String?
transmission    String?
fuelEfficiency  Float?
imageUrl        String?
scrapedSource   String?
createdAt       DateTime
```

**Recommendation**
```
id                  UUID
userId              UUID → User
carId               UUID → Car
estimatedMonthlyCost  Float
insuranceCost         Float
loanCost              Float
maintenanceCost       Float
fuelCost              Float
score                 Float (0.0–1.0)
createdAt             DateTime
```

**UserPreference**
```
id              UUID
userId          UUID → User
preferredBrand  String?
carType         String?
fuelType        String?
transmission    String?
createdAt       DateTime
```

**InsuranceEstimate**
```
id                UUID
carId             UUID → Car
location          String
riskCategory      String
estimatedMonthly  Float
createdAt         DateTime
```

---

## 8. How Data Flows Through the App

Here is the complete journey from a new user arriving to seeing recommendations:

```
1. User arrives at /
   └─ Chooses signup or guest mode

2. If signup:
   └─ POST /auth/signup
      └─ bcrypt hash password
      └─ Store in DB (no profile yet)
      └─ Return JWT

3. User goes to /form
   └─ Answers 16 questions
   └─ Answers stored in sessionStorage as form_answers

4. On submit:
   ├─ POST /credit-score/check
   │   └─ DTI ratio → simulated score (300–850)
   │
   ├─ POST /users (upsert by email)
   │   └─ Saves: name, ID, salary, expenses, location, gender, years licensed
   │
   ├─ POST /users/:id/preferences
   │   └─ Saves: preferred brand, car type, fuel type, transmission
   │
   └─ POST /ai-recommendations/generate
       ├─ Build user budget (salary × 20%)
       ├─ Generate 5 Serper search queries (GPT-4o)
       ├─ Run 5 web searches in parallel (Serper.dev)
       ├─ Run 5 image searches in parallel (Serper.dev)
       ├─ Process all results (GPT-4o)
       └─ Return 5 Recommendation objects

5. Recommendations stored in sessionStorage
   └─ User redirected to /dashboard

6. On dashboard:
   └─ User selects preferred car
       ├─ Page scrolls to AI chat
       └─ POST /ai-advisor/chat (opening message)
           └─ GPT-4o greets user, asks first question

7. User chats with advisor
   └─ Each message: POST /ai-advisor/chat
       ├─ GPT-4o may call tools (update_expenses, search_cars, etc.)
       └─ Actions applied to frontend state in real time
```

---

## 9. Environment Variables Reference

### Backend (`firstcarai_api/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `PORT` | No | API port (default: 3001) |
| `CORS_ORIGIN` | No | Allowed origin (default: *) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens — use a long random string in production |
| `AI_PROVIDER` | Yes | Which AI to use: `openai`, `gemini`, or `anthropic` |
| `OPENAI_API_KEY` | Yes (if openai) | OpenAI API key |
| `GEMINI_API_KEY` | Yes (if gemini) | Google Gemini API key |
| `ANTHROPIC_API_KEY` | Yes (if anthropic) | Anthropic API key |
| `SERPER_KEY` | Recommended | Serper.dev key for live Google search |

### Frontend (`firstcar_frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend URL (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_USE_MOCK_DATA` | No | Set to `true` to skip the backend entirely |
| `OPENAI_API_KEY` | Yes | OpenAI key for the AI advisor chat (server-side only — not exposed to browser) |

---

## 10. Third-Party Services

| Service | Used For | Where |
|---|---|---|
| **OpenAI (GPT-4o)** | Car recommendations, AI advisor chat, expense analysis | Backend + Frontend API route |
| **Serper.dev** | Google search for real car listings and images | Backend |
| **Supabase** | PostgreSQL database hosting | Backend |
| **Google Gemini** | Alternative AI provider for recommendations | Backend |
| **Anthropic Claude** | Alternative AI provider for expense analysis | Backend |

### Serper.dev Usage

Each car recommendation request uses approximately **10 Serper credits**:
- 5 web searches (one per query)
- 5 image searches (one per recommended car)

At the time of writing, Serper offers a free tier with 2,500 searches.

---

## 11. Known Issues & Things to Fix Before Going Live

These are the current limitations that should be addressed before launching publicly:

### Security

| Issue | Risk | Fix |
|---|---|---|
| API keys in `.env` files | Anyone with file access can use your paid API accounts | Use environment secrets from your hosting provider (Vercel, Railway, etc.) |
| `JWT_SECRET` is a placeholder string | Tokens could be forged | Generate a random 256-bit secret |
| `/admin` page has no auth guard | Anyone who knows the URL can see all users | Add a JWT guard + admin role check to the admin page and its API endpoints |
| Password reset link returned in API response | Should be emailed to the user | Integrate an email provider (e.g. Resend, SendGrid) and send the link by email instead |

### Functionality

| Issue | Impact | Fix |
|---|---|---|
| No email verification on signup | Fake accounts | Add email verification step |
| Credit score is simulated | Not a real creditworthiness check | Integrate with a real SA credit bureau API |
| Car prices from AI search may be outdated | User sees wrong price | Add a "prices are estimates" disclaimer |
| Recommendations not saved to DB | Refreshing the page loses results if sessionStorage clears | Save recommendations to the `Recommendation` table and load from DB on login |

### Performance

| Issue | Fix |
|---|---|
| AI recommendation generation takes 15–45 seconds | Add a progress indicator or stream the response |
| All Serper searches run on every recommendation request | Cache results for the same budget/location combination for a few hours |

---

## 12. Project File Map

```
FirstCar/
├── firstcar_frontend/                   Next.js frontend
│   ├── app/
│   │   ├── page.tsx                     Login / Signup
│   │   ├── form/page.tsx                16-step questionnaire
│   │   ├── dashboard/page.tsx           Main app (recommendations, chat)
│   │   ├── admin/page.tsx               User management table
│   │   ├── r/[email]/[uuid]/page.tsx    Password reset
│   │   └── api/ai-advisor/route.ts      Server-side AI advisor proxy
│   ├── lib/
│   │   └── recommendations.ts           All API calls + types
│   ├── components/ui/
│   │   ├── auth-components.tsx          Animated login/signup forms
│   │   └── button.tsx                   Button component
│   └── .env.local                       Frontend environment variables
│
└── firstcarai_api/                      NestJS backend
    ├── src/
    │   ├── app.module.ts                Root module
    │   └── modules/
    │       ├── auth/                    Signup, login, password reset
    │       ├── users/                   User CRUD + preferences
    │       ├── ai-recommendations/      AI car search engine
    │       ├── ai-advisor/              AI chat with tool calling
    │       ├── credit-score/            Simulated credit scoring
    │       ├── analyze-expenses/        Bank statement parsing
    │       ├── prisma/                  Database client
    │       └── supabase/                Supabase client (legacy)
    ├── prisma/
    │   └── schema.prisma                Database schema
    └── .env                             Backend environment variables
```
