import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

// Matches the Recommendation shape the frontend expects
export interface AiCar {
  id: string;
  make: string;
  model: string;
  year: number | null;
  price: number | null;
  fuelType: string | null;
  transmission: string | null;
  mileage: number | null;
  imageUrl: string | null;
}

export interface AiDealer {
  name: string;
  location: string;
  reputationNote: string;
}

export interface AiRecommendation {
  id: string;
  estimatedMonthlyCost: number;
  insuranceCost: number;
  loanCost: number;
  maintenanceCost: number;
  fuelCost: number;
  score: number;
  car: AiCar;
  dealer: AiDealer | null;
}

function buildPrompt(user: {
  netSalary: number;
  creditScore: number;
  location: string | null;
  yearsLicensed: number | null;
  gender: string | null;
}): string {
  const monthlyBudget = Math.round(user.netSalary * 0.2);
  // Rough max car price: budget × 70% (for loan) × 60 months
  const maxCarPrice = Math.round(monthlyBudget * 0.7 * 60);

  const creditLabel =
    user.creditScore >= 750 ? 'Excellent' :
      user.creditScore >= 700 ? 'Good' :
        user.creditScore >= 650 ? 'Fair' :
          user.creditScore >= 600 ? 'Poor' : 'Very Poor';

  return `You are a South African first-car advisor. Search the internet for real, currently available cars (both brand-new AND used) from ONLY the most reputable dealerships in South Africa that match the buyer's profile.

BUYER PROFILE:
- Monthly net salary: R${user.netSalary.toLocaleString()}
- Total car budget (20% rule): R${monthlyBudget.toLocaleString()} per month (loan + insurance + fuel + maintenance combined)
- Max car purchase price: approximately R${maxCarPrice.toLocaleString()}
- Location: ${user.location ?? 'South Africa'}
- Credit score: ${user.creditScore} (${creditLabel})
- Years licensed: ${user.yearsLicensed ?? 'unknown'}

INSTRUCTIONS:

1. RESTRICT TO THESE TOP 10 REPUTABLE DEALERSHIPS IN SOUTH AFRICA:
   
   *Mega Dealer Groups (National Footprint)*
   1. *Motus Group* – South Africa's largest vehicle dealership group, representing 22 OEMs through 321 dealerships nationwide[reference:0].
   2. *Bidvest Automotive* – One of SA's largest and most respected motor retailers with over 100 years of operation and more than 85 franchised dealerships[reference:1].
   3. *WeBuyCars* – The largest used vehicle dealer in SA with 17 branches and over 12,000 vehicles in stock. However, exercise caution: the group was recently fined R2.5 million for breaching the Consumer Protection Act[reference:2].
   4. *IPOP Group* – The top-performing dealer group in 2025, including standout Suzuki Bassonia and Suzuki West Rand with the highest sales volumes[reference:3].

   *Award-Winning Standalone Dealerships*
   5. *Mit Mak Motors (Gerrit Maritz)* – Winner of both the Dealer Reputation Award and AutoTrader Dealer of the Year 2025, recognized for leadership in transparency and customer satisfaction[reference:4].
   6. *Citton Cars* – Family-owned, reputable for used vehicles. Each car undergoes a 125+ point Bosch inspection and over 15 hours of reconditioning prior to sale[reference:5].
   7. *Zido Cars* – MIOSA-approved and Independent Dealer Association-approved, Zido does not sell accident vehicles or structurally damaged cars. All vehicles are thoroughly verified to be legitimate and not stolen[reference:6].
   8. *King of Cars (Boksburg)* – Operates since 2003 with over 200 professionally evaluated vehicles. Solid reputation for dependable pre-owned vehicles[reference:7].

   *Top Brand-Specific Dealerships*
   9. *Humansdorp Toyota* – Toyota dealership with 41+ years of experience, consistently ranking among top SA dealerships for customer service. Winner of Customer Experience (CE) Dealer of the Year[reference:8].
   10. *Suzuki Kenilworth* – Suzuki's overall Dealer of the Year for the second year running, also Medium Dealer of the Year[reference:9].
   11. *Suzuki Bassonia* – Highest dealership in SA by sales volume in 2025[reference:10].
   12. *CMH Ford Durban* – Celebrated 47 years as KwaZulu-Natal's most trusted Ford dealership, with an Approved Pre-Owned Department offering certified used vehicles[reference:11].

   *Also Consider (Runner-Ups)*
   - *EAE Motors* – Winner of AutoTrader Stock Velocity Award[reference:12].
   - *Dadas Motorland* – Winner of AutoTrader Profitability Award[reference:13].
   - *Toyota Pretoria* – Leading market share, known for reliable customer service and after-sales support[reference:14].
   - *Volkswagen Centurion* – Renowned for knowledgeable staff and timely service with comprehensive vehicle selection[reference:15].

2. SEARCH FOR VEHICLES:
   Search AutoTrader SA (www.autotrader.co.za) and Cars.co.za for cars from the above-listed dealerships only. Focus on both new and used cars within R${maxCarPrice.toLocaleString()}.

3. CALCULATE ACTUAL MONTHLY COSTS FOR EACH CAR INDIVIDUALLY:
   Every car has a different price, so every car must have DIFFERENT cost numbers.
   Do NOT use the same values for multiple cars — calculate each from the car's actual price.

   - *Loan repayment*: Use the formula P × r(1+r)^n / ((1+r)^n − 1) over 60 months.
     Interest rate: 13% p.a. (credit score ≥ 650) or 18% p.a. (below 650). New cars: 11.5%–13%.
     Example: R180,000 car at 13% p.a. = ~R4,100/month. R250,000 car = ~R5,700/month.
   - *Insurance*: OUTsurance/King Price/Santam estimate. Roughly 1.0%–1.5% of car value per month
     for a first-time buyer. Adjust for location and credit score.
     Example: R180,000 car ≈ R1,500–R2,000/month. R250,000 car ≈ R2,000–R2,800/month.
   - *Fuel*: 1,200 km/month at R22/litre. Use actual fuel consumption for the model (5–8 L/100km).
     Example: 6 L/100km × 1,200 km ÷ 100 × R22 = R1,584/month.
   - *Maintenance*: 0.5% of car value per year ÷ 12 for new (service plan included);
     1.0% per year ÷ 12 for used. Example: R180,000 used = R150/month.
   - *estimatedMonthlyCost*: MUST equal loanCost + insuranceCost + fuelCost + maintenanceCost exactly.

4. CAR SELECTION:
   Prefer cars whose total monthly cost fits within R${monthlyBudget.toLocaleString()}, but include
   up to 1–2 slightly over-budget options if they are significantly better value. Cars must be a mix
   of new and used.

5. SCORING:
   Score 0.0–1.0. Higher = better value. Factor in: affordability vs budget, car age, reliability,
   resale value, and suitability for a first-time buyer. Each car must have a DIFFERENT score.

Return a JSON array of exactly 5 recommendations. Each must match this TypeScript type exactly:

{
  id: string,                  // e.g. "citton-cars-suzuki-swift-2022"
  estimatedMonthlyCost: number, // MUST equal loanCost + insuranceCost + fuelCost + maintenanceCost
  insuranceCost: number,        // monthly insurance in ZAR (varies per car)
  loanCost: number,             // monthly loan repayment in ZAR (varies per car price)
  maintenanceCost: number,      // monthly maintenance in ZAR (varies per car)
  fuelCost: number,             // monthly fuel cost in ZAR (varies per model)
  score: number,                // 0.0–1.0, higher = better value
  car: {
    id: string,                 // same as above
    make: string,
    model: string,
    year: number,
    price: number,
    fuelType: string,           // "petrol" | "diesel" | "hybrid" | "electric"
    transmission: string,       // "manual" | "automatic"
    mileage: number,            // for new cars: 0–100 km; for used: actual km
    imageUrl: string | null
  },
  dealer: {
    name: string,               // e.g. "Citton Cars"
    location: string,           // e.g. "Gauteng, South Africa"
    reputationNote: string      // brief note on dealership credibility
  }
}

Return ONLY the raw JSON array — no markdown, no explanation, no code fences.`;
}

function extractJson(raw: string): string {
  // 1. Strip markdown code fences
  let text = raw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();

  // 2. Find the outermost JSON array — handles cases where the AI wraps
  //    the array in explanation text before or after it
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  return text;
}

const parseLogger = new Logger('AiRecommendationsParser');

function parseAiResponse(raw: string): AiRecommendation[] {
  const cleaned = extractJson(raw);
  parseLogger.log(`[parser] cleaned length=${cleaned.length} preview="${cleaned.slice(0, 200)}"`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    parseLogger.error(`[parser] JSON.parse failed. cleaned="${cleaned.slice(0, 500)}"`, err instanceof Error ? err.message : err);
    throw new BadRequestException('AI returned an unexpected response format. Please try again.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    parseLogger.error(`[parser] not an array or empty. type=${typeof parsed}`);
    throw new BadRequestException('AI returned an empty or invalid recommendations list.');
  }

  return (parsed as any[]).map((item, i) => ({
    id: String(item.id ?? crypto.randomUUID()),
    estimatedMonthlyCost: Number(item.estimatedMonthlyCost ?? 0),
    insuranceCost: Number(item.insuranceCost ?? 0),
    loanCost: Number(item.loanCost ?? 0),
    maintenanceCost: Number(item.maintenanceCost ?? 0),
    fuelCost: Number(item.fuelCost ?? 0),
    score: Number(item.score ?? 0),
    car: {
      id: String(item.car?.id ?? `ai-car-${i}`),
      make: String(item.car?.make ?? ''),
      model: String(item.car?.model ?? ''),
      year: item.car?.year != null ? Number(item.car.year) : null,
      price: item.car?.price != null ? Number(item.car.price) : null,
      fuelType: item.car?.fuelType ?? null,
      transmission: item.car?.transmission ?? null,
      mileage: item.car?.mileage != null ? Number(item.car.mileage) : null,
      imageUrl: typeof item.car?.imageUrl === 'string' && item.car.imageUrl ? item.car.imageUrl : null,
    },
    dealer: item.dealer
      ? {
          name: String(item.dealer.name ?? ''),
          location: String(item.dealer.location ?? ''),
          reputationNote: String(item.dealer.reputationNote ?? ''),
        }
      : null,
  }));
}

@Injectable()
export class AiRecommendationsService {
  private readonly logger = new Logger(AiRecommendationsService.name);
  constructor(private readonly prisma: PrismaService) { }

  async generate(dto: {
    userId?: string;
    netSalary?: number;
    creditScore?: number;
    location?: string;
    yearsLicensed?: number;
  }): Promise<AiRecommendation[]> {
    let profile: {
      netSalary: number;
      creditScore: number;
      location: string | null;
      yearsLicensed: number | null;
      gender: string | null;
    };

    if (dto.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException(`User ${dto.userId} not found`);
      if (!user.netSalary || !user.creditScore) {
        throw new BadRequestException('User must complete the questionnaire before generating AI recommendations.');
      }
      profile = {
        netSalary: Number(user.netSalary),
        creditScore: user.creditScore,
        location: user.location,
        yearsLicensed: user.yearsLicensed,
        gender: user.gender,
      };
    } else {
      if (!dto.netSalary || !dto.creditScore) {
        throw new BadRequestException('netSalary and creditScore are required for guest recommendations.');
      }
      profile = {
        netSalary: dto.netSalary,
        creditScore: dto.creditScore,
        location: dto.location ?? null,
        yearsLicensed: dto.yearsLicensed ?? null,
        gender: null,
      };
    }

    const prompt = buildPrompt(profile);
    const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();

    this.logger.log(`[ai-recommendations] provider=${provider} userId=${dto.userId ?? 'guest'} salary=${profile.netSalary} location=${profile.location}`);

    try {
      let result: AiRecommendation[];
      switch (provider) {
        case 'openai':
          result = await this.searchWithOpenAI(prompt);
          break;
        case 'anthropic':
          result = await this.searchWithAnthropic(prompt);
          break;
        case 'gemini':
          result = await this.searchWithGemini(prompt);
          break;
        default:
          throw new BadRequestException(
            `Unknown AI_PROVIDER "${provider}". Use "openai", "anthropic", or "gemini".`,
          );
      }
      this.logger.log(`[ai-recommendations] success count=${result.length}`);
      return result;
    } catch (err) {
      this.logger.error(`[ai-recommendations] failed provider=${provider}`, err instanceof Error ? err.stack : err);
      throw err;
    }
  }

  // ── OpenAI: uses built-in web_search_preview tool (Perplexity-style) ───────

  private async searchWithOpenAI(prompt: string): Promise<AiRecommendation[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new BadRequestException('OPENAI_API_KEY is not set.');

    const serperKey = process.env.SERPER_KEY;
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    const chat = (content: string) =>
      client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content }],
        temperature: 0.2,
      }).then((r) => r.choices[0]?.message?.content?.trim() ?? '');

    if (serperKey) {
      // Step 1 — OpenAI generates targeted search queries from the buyer profile
      this.logger.log('[ai-recommendations/openai+serper] step 1: generating search queries');
      const queryGenPrompt = `${prompt}

Based on this buyer profile, generate exactly 5 Google search queries:
- 1 for used cars for sale in South Africa within the buyer's max price (target autotrader.co.za)
- 1 for new cars for sale in South Africa within the buyer's max price (target autotrader.co.za)
- 1 for used OR new cars for sale within budget (target cars.co.za)
- 2 for car insurance quotes in South Africa for a first-time buyer in the buyer's province

Mix of new and used is important — do not limit to only used or only new cars.

Return ONLY a JSON array of 5 strings — no explanation, no markdown. Example:
["used cars for sale Gauteng under R200000 site:autotrader.co.za", "new cars for sale Gauteng under R220000 site:autotrader.co.za", "..."]`;

      const queryRaw = await chat(queryGenPrompt);
      const queryJson = queryRaw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();

      let queries: string[] = [];
      try {
        queries = JSON.parse(queryJson);
      } catch {
        this.logger.warn('[ai-recommendations/openai+serper] could not parse query list, using fallbacks');
      }
      if (!Array.isArray(queries) || queries.length === 0) {
        queries = [
          'used cars for sale South Africa under R200000 site:autotrader.co.za',
          'new cars for sale South Africa under R250000 site:autotrader.co.za',
          'used new affordable cars for sale South Africa site:cars.co.za',
          'car insurance quotes South Africa first time buyer',
          'OUTsurance King Price Naked insurance estimate South Africa',
        ];
      }

      // Step 2 — Run all queries through Serper in parallel
      this.logger.log(`[ai-recommendations/openai+serper] step 2: running ${queries.length} Serper searches`);
      const searchResults = await Promise.allSettled(
        queries.map((q) => this.serperSearch(q, serperKey)),
      );

      const snippets: string[] = [];
      for (let i = 0; i < searchResults.length; i++) {
        const r = searchResults[i];
        if (r.status === 'fulfilled') {
          for (const item of r.value) {
            snippets.push(`Title: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}`);
          }
        } else {
          this.logger.warn(`[serper] query ${i} failed: ${r.reason}`);
        }
      }

      if (snippets.length > 0) {
        // Step 3 — OpenAI processes real search results into structured JSON
        this.logger.log(`[ai-recommendations/openai+serper] step 3: ${snippets.length} results → gpt-4o formats JSON`);
        const processingPrompt = `${prompt}

REAL GOOGLE SEARCH RESULTS (from Serper.dev):
${snippets.join('\n---\n')}

Using the buyer profile above and the real search results, produce the 5 best car recommendations.

CRITICAL REQUIREMENTS:
- Extract real car details (make, model, year, price, mileage) from the search snippets
- Include a MIX of new and used cars — at least 2 new and at least 2 used
- For new cars set mileage to 0; for used cars use the actual mileage from the listing
- Calculate each cost component from the car's ACTUAL price — every car must have DIFFERENT numbers
- loanCost: use loan formula over 60 months at appropriate interest rate for the car price
- insuranceCost: ~1.0%–1.5% of car value per month for first-time buyers
- fuelCost: actual fuel consumption for that model × 1,200 km/month × R22/litre
- maintenanceCost: 0.5% of price/year ÷ 12 for new; 1.0% for used
- estimatedMonthlyCost MUST equal loanCost + insuranceCost + fuelCost + maintenanceCost exactly
- Set imageUrl to null

Return ONLY a raw JSON array — no markdown, no explanation.`;

        const raw = await chat(processingPrompt);
        if (raw) {
          this.logger.log(`[ai-recommendations/openai+serper] done, raw length=${raw.length}`);
          const recs = parseAiResponse(raw);
          return this.attachImages(recs, serperKey);
        }
      }

      this.logger.warn('[ai-recommendations/openai+serper] Serper returned nothing, falling back to gpt-4o knowledge');
    }

    // Fallback — gpt-4o with training knowledge only (no web search)
    this.logger.log('[ai-recommendations/openai] calling gpt-4o (knowledge-based fallback)');
    const raw = await chat(prompt);
    if (!raw) throw new BadRequestException('OpenAI returned an empty response.');
    this.logger.log(`[ai-recommendations/openai] raw length=${raw.length} preview="${raw.slice(0, 300)}"`);
    const recs = parseAiResponse(raw);
    return serperKey ? this.attachImages(recs, serperKey) : recs;
  }

  // ── Anthropic: no live search, but strong reasoning from training data ──────

  private async searchWithAnthropic(prompt: string): Promise<AiRecommendation[]> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new BadRequestException('ANTHROPIC_API_KEY is not set.');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text.trim();
    return parseAiResponse(raw);
  }

  // ── Serper.dev helpers ────────────────────────────────────────────────────────

  private async serperSearch(query: string, apiKey: string): Promise<{ title: string; snippet: string; link: string }[]> {
    this.logger.log(`[serper] query="${query}"`);
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'za', hl: 'en', num: 10 }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Serper error ${res.status}: ${text}`);
    }
    const data: any = await res.json();
    return (data?.organic ?? []).map((item: any) => ({
      title: item.title ?? '',
      snippet: item.snippet ?? '',
      link: item.link ?? '',
    }));
  }

  private async serperImageSearch(query: string, apiKey: string): Promise<string | null> {
    try {
      const res = await fetch('https://google.serper.dev/images', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'za', num: 3 }),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      const first = data?.images?.[0];
      return first?.imageUrl ?? first?.thumbnailUrl ?? null;
    } catch {
      return null;
    }
  }

  private async attachImages(recs: AiRecommendation[], serperKey: string): Promise<AiRecommendation[]> {
    const withImages = await Promise.all(
      recs.map(async (rec) => {
        const query = `${rec.car.year ?? ''} ${rec.car.make} ${rec.car.model} car`.trim();
        const imageUrl = await this.serperImageSearch(query, serperKey);
        return imageUrl ? { ...rec, car: { ...rec.car, imageUrl } } : rec;
      }),
    );
    this.logger.log(`[serper/images] attached images to ${withImages.filter((r) => r.car.imageUrl).length}/${recs.length} cars`);
    return withImages;
  }

  // ── Gemini: Step 1 — AI generates queries, Step 2 — Serper searches, Step 3 — AI formats ──

  private async searchWithGemini(prompt: string): Promise<AiRecommendation[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new BadRequestException('GEMINI_API_KEY is not set.');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const serperKey = process.env.SERPER_KEY;

    if (serperKey) {
      // ── 3-step Serper flow ──────────────────────────────────────────────────
      this.logger.log('[ai-recommendations/gemini+serper] step 1: generating search queries');

      // Step 1: Ask Gemini to generate targeted search queries from the user profile
      const queryGenPrompt = `${prompt}

Based on this buyer profile, generate exactly 4 Google search queries to find:
- 2 queries for affordable used/new cars for sale in South Africa within the buyer's budget (target autotrader.co.za and cars.co.za)
- 2 queries for car insurance quotes in South Africa for a first-time buyer in the buyer's province

Return ONLY a JSON array of 4 strings — no explanation, no markdown. Example:
["used Toyota Starlet for sale Gauteng under R200000 site:autotrader.co.za", "..."]`;

      const queryResult = await model.generateContent(queryGenPrompt);
      const queryRaw = queryResult.response.text().trim();
      const queryJson = queryRaw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();

      let queries: string[] = [];
      try {
        queries = JSON.parse(queryJson);
      } catch {
        this.logger.warn('[ai-recommendations/gemini+serper] failed to parse query list, using fallbacks');
      }

      // Fallback queries if AI parse fails
      if (!Array.isArray(queries) || queries.length === 0) {
        queries = [
          `used cars for sale South Africa site:autotrader.co.za`,
          `affordable cars for sale South Africa site:cars.co.za`,
          `car insurance quotes South Africa first time buyer`,
          `OUTsurance King Price car insurance estimate South Africa`,
        ];
      }

      this.logger.log(`[ai-recommendations/gemini+serper] step 2: running ${queries.length} Serper searches`);

      // Step 2: Run all queries through Serper in parallel
      const searchResults = await Promise.allSettled(
        queries.map((q) => this.serperSearch(q, serperKey)),
      );

      const snippets: string[] = [];
      for (let i = 0; i < searchResults.length; i++) {
        const r = searchResults[i];
        if (r.status === 'fulfilled') {
          for (const item of r.value) {
            snippets.push(`Title: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}`);
          }
        } else {
          this.logger.warn(`[serper] query ${i} failed: ${r.reason}`);
        }
      }

      if (snippets.length === 0) {
        this.logger.warn('[ai-recommendations/gemini+serper] no results from Serper, falling back to Gemini-only');
      } else {
        this.logger.log(`[ai-recommendations/gemini+serper] step 3: ${snippets.length} results → Gemini formats JSON`);

        // Step 3: Feed real search results to Gemini to produce the final structured JSON
        const processingPrompt = `${prompt}

REAL GOOGLE SEARCH RESULTS (from Serper.dev):
${snippets.join('\n---\n')}

Using the buyer profile and the real search results above, produce the 5 best car recommendations. Extract car details (make, model, year, price, mileage) from the search snippets where available. Calculate all monthly costs using the rules in the profile. Set imageUrl to null.

Return ONLY a raw JSON array — no markdown, no explanation.`;

        const finalResult = await model.generateContent(processingPrompt);
        const raw = finalResult.response.text().trim();
        if (raw) {
          this.logger.log(`[ai-recommendations/gemini+serper] done, raw length=${raw.length}`);
          return parseAiResponse(raw);
        }
      }
    }

    // ── Fallback: Gemini with Google Search grounding (no Serper key) ──────────
    this.logger.log('[ai-recommendations/gemini] falling back to Google Search grounding');
    const groundedModel = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} } as any],
    });

    const result = await groundedModel.generateContent(prompt);
    const raw = result.response.text().trim();
    if (!raw) {
      throw new BadRequestException('Gemini returned an empty response. Please try again.');
    }
    this.logger.log(`[ai-recommendations/gemini] raw length=${raw.length}`);
    return parseAiResponse(raw);
  }
}
