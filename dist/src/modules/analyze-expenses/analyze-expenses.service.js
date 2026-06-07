"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AnalyzeExpensesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeExpensesService = void 0;
const common_1 = require("@nestjs/common");
const UTILITY_BILL_PROMPT = `You are analyzing a South African municipal or electricity bill to extract the account holder's location.
Extract the province and city/municipality from the billing address or account details.

SA provinces: Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, North West, Northern Cape, Western Cape.

Return ONLY a valid JSON object with no explanation or markdown:
{"province": "<province name or null>", "city": "<city/town name or null>"}`;
const PAYSLIP_PROMPT = `You are analyzing a South African payslip. Extract the employee's net (take-home) salary — the final amount paid after all deductions.
Look for labels like "Net Pay", "Net Salary", "Take Home Pay", "Nett Pay", "Amount Payable".
Return the amount as a plain number in Rand (no currency symbols or commas).

Return ONLY a valid JSON object with no explanation or markdown:
{"netSalary": <number or null>}`;
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
let AnalyzeExpensesService = AnalyzeExpensesService_1 = class AnalyzeExpensesService {
    logger = new common_1.Logger(AnalyzeExpensesService_1.name);
    async analyze(dto) {
        const provider = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase();
        const text = dto.text.slice(0, 40000);
        this.logger.log(`[analyze-expenses] provider=${provider} text_length=${text.length}`);
        try {
            let result;
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
                    throw new common_1.BadRequestException(`Unknown AI_PROVIDER "${provider}". Use "anthropic", "openai", or "gemini".`);
            }
            this.logger.log(`[analyze-expenses] success result=${JSON.stringify(result)}`);
            return result;
        }
        catch (err) {
            this.logger.error(`[analyze-expenses] failed provider=${provider}`, err instanceof Error ? err.stack : err);
            throw err;
        }
    }
    async analyzeWithAnthropic(text) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey)
            throw new common_1.BadRequestException('ANTHROPIC_API_KEY is not set.');
        const { Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 256,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: `Bank statement:\n${text}` }],
        });
        const raw = message.content[0].text.trim();
        return this.parseJson(raw);
    }
    async analyzeWithOpenAI(text) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey)
            throw new common_1.BadRequestException('OPENAI_API_KEY is not set.');
        this.logger.log('[analyze-expenses/openai] calling gpt-4o-mini');
        const { OpenAI } = await import('openai');
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
    async analyzeWithGemini(text) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new common_1.BadRequestException('GEMINI_API_KEY is not set.');
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
    async analyzeDocument(dto) {
        const provider = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase();
        const text = dto.text.slice(0, 40000);
        const docType = dto.documentType ?? 'BANK_STATEMENT';
        let systemPrompt;
        if (docType === 'UTILITY_BILL') {
            systemPrompt = UTILITY_BILL_PROMPT;
        }
        else if (docType === 'PAYSLIP') {
            systemPrompt = PAYSLIP_PROMPT;
        }
        else {
            systemPrompt = SYSTEM_PROMPT;
        }
        this.logger.log(`[analyze-document] provider=${provider} docType=${docType} text_length=${text.length}`);
        try {
            let raw;
            switch (provider) {
                case 'anthropic':
                    raw = await this.callAnthropic(text, systemPrompt);
                    break;
                case 'openai':
                    raw = await this.callOpenAI(text, systemPrompt);
                    break;
                case 'gemini':
                    raw = await this.callGemini(text, systemPrompt);
                    break;
                default:
                    throw new common_1.BadRequestException(`Unknown AI_PROVIDER "${provider}".`);
            }
            const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
            const parsed = JSON.parse(cleaned);
            if (docType === 'UTILITY_BILL') {
                return {
                    province: parsed.province ?? null,
                    city: parsed.city ?? null,
                };
            }
            else if (docType === 'PAYSLIP') {
                return {
                    netSalary: parsed.netSalary != null ? Number(parsed.netSalary) : null,
                };
            }
            else {
                return {
                    groceries: Number(parsed.groceries ?? 0),
                    accounts: Number(parsed.accounts ?? 0),
                    loans: Number(parsed.loans ?? 0),
                    other: Number(parsed.other ?? 0),
                };
            }
        }
        catch (err) {
            this.logger.error(`[analyze-document] failed`, err instanceof Error ? err.stack : err);
            throw err;
        }
    }
    async callAnthropic(text, systemPrompt) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey)
            throw new common_1.BadRequestException('ANTHROPIC_API_KEY is not set.');
        const { Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 256,
            system: systemPrompt,
            messages: [{ role: 'user', content: `Document text:\n${text}` }],
        });
        return message.content[0].text.trim();
    }
    async callOpenAI(text, systemPrompt) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey)
            throw new common_1.BadRequestException('OPENAI_API_KEY is not set.');
        const { OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey });
        const completion = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            max_tokens: 256,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Document text:\n${text}` },
            ],
        });
        return completion.choices[0].message.content?.trim() ?? '';
    }
    async callGemini(text, systemPrompt) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new common_1.BadRequestException('GEMINI_API_KEY is not set.');
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPrompt });
        const result = await model.generateContent(`Document text:\n${text}`);
        return result.response.text().trim();
    }
    parseJson(raw) {
        const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        }
        catch (err) {
            this.logger.error(`[analyze-expenses] JSON parse failed. raw="${raw.slice(0, 500)}"`, err);
            throw new common_1.BadRequestException('AI returned an unexpected response format. Please try again.');
        }
        const obj = parsed;
        return {
            groceries: Number(obj.groceries ?? 0),
            accounts: Number(obj.accounts ?? 0),
            loans: Number(obj.loans ?? 0),
            other: Number(obj.other ?? 0),
        };
    }
};
exports.AnalyzeExpensesService = AnalyzeExpensesService;
exports.AnalyzeExpensesService = AnalyzeExpensesService = AnalyzeExpensesService_1 = __decorate([
    (0, common_1.Injectable)()
], AnalyzeExpensesService);
//# sourceMappingURL=analyze-expenses.service.js.map