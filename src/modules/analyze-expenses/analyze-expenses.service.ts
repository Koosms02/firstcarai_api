import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AnalyzeExpensesDto } from './dto/analyze-expenses.dto';

export interface ExpenseBreakdown {
  groceries: number;
  accounts: number;
  loans: number;
  other: number;
}

const SYSTEM_PROMPT = `You are a South African bank statement analyst. Analyze the provided bank statement text and categorize all debit/expense transactions into:
- groceries: food and grocery stores (Woolworths, Pick n Pay, PnP, Shoprite, Checkers, SPAR, Food Lovers, Boxer, OK Foods, etc.)
- accounts: clothing and retail store accounts (Edgars, Truworths, Mr Price, Foschini, Ackermans, PEP, TFG, QSP, Markham, Legit, etc.)
- loans: loan repayments, credit card payments, bond/mortgage payments, vehicle finance, debt repayments (WesBank, DirectAxis, Bayport, RCS, African Bank, Capitec Credit, etc.)
- other: all other regular debits that are expenses not covered above (subscriptions, utilities, insurance premiums, cell phone contracts, gym memberships, etc.)

Rules:
- Only include debit transactions (money going out), not income, deposits, or running balances
- Sum up all transactions per category over the statement period
- Return amounts in South African Rand as plain numbers (no currency symbols or commas)
- If a category has no transactions, return 0
- Return ONLY a valid JSON object with no explanation or markdown

Response format:
{"groceries": <number>, "accounts": <number>, "loans": <number>, "other": <number>}`;

@Injectable()
export class AnalyzeExpensesService {
  private readonly logger = new Logger(AnalyzeExpensesService.name);

  async analyze(dto: AnalyzeExpensesDto): Promise<ExpenseBreakdown> {
    const provider = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase();

    // Truncate to avoid exceeding context limits on very long statements
    const text = dto.text.slice(0, 40000);

    this.logger.log(`[analyze-expenses] provider=${provider} text_length=${text.length}`);

    try {
      let result: ExpenseBreakdown;
      switch (provider) {
        case 'anthropic':
          result = await this.analyzeWithAnthropic(text);
          break;
        case 'openai':
          result = await this.analyzeWithOpenAI(text);
          break;
        case 'gemini':
          result = await this.analyzeWithGemini(text);
          break;
        default:
          throw new BadRequestException(
            `Unknown AI_PROVIDER "${provider}". Use "anthropic", "openai", or "gemini".`,
          );
      }
      this.logger.log(`[analyze-expenses] success result=${JSON.stringify(result)}`);
      return result;
    } catch (err) {
      this.logger.error(`[analyze-expenses] failed provider=${provider}`, err instanceof Error ? err.stack : err);
      throw err;
    }
  }

  private async analyzeWithAnthropic(text: string): Promise<ExpenseBreakdown> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new BadRequestException('ANTHROPIC_API_KEY is not set.');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Bank statement:\n${text}` }],
    });

    const raw = (message.content[0] as { text: string }).text.trim();
    return this.parseJson(raw);
  }

  private async analyzeWithOpenAI(text: string): Promise<ExpenseBreakdown> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new BadRequestException('OPENAI_API_KEY is not set.');

    this.logger.log('[analyze-expenses/openai] calling gpt-4o-mini');
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 256,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Bank statement:\n${text}` },
      ],
    });

    const raw = completion.choices[0].message.content?.trim() ?? '';
    this.logger.log(`[analyze-expenses/openai] raw response: ${raw.slice(0, 300)}`);
    return this.parseJson(raw);
  }

  private async analyzeWithGemini(text: string): Promise<ExpenseBreakdown> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new BadRequestException('GEMINI_API_KEY is not set.');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(`Bank statement:\n${text}`);
    const raw = result.response.text().trim();
    return this.parseJson(raw);
  }

  private parseJson(raw: string): ExpenseBreakdown {
    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      this.logger.error(`[analyze-expenses] JSON parse failed. raw="${raw.slice(0, 500)}"`, err);
      throw new BadRequestException(
        'AI returned an unexpected response format. Please try again.',
      );
    }

    const obj = parsed as Record<string, unknown>;
    return {
      groceries: Number(obj.groceries ?? 0),
      accounts: Number(obj.accounts ?? 0),
      loans: Number(obj.loans ?? 0),
      other: Number(obj.other ?? 0),
    };
  }
}
