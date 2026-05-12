import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatAdvisorDto } from './dto/chat-advisor.dto';

export type AdvisorAction =
  | { type: 'update_expenses'; groceries?: number; accounts?: number; loans?: number; other?: number }
  | { type: 'update_profile'; netSalary?: number; location?: string; yearsLicensed?: number }
  | { type: 'search_cars'; budget: number; carType?: string; fuelType?: string; transmission?: string };

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'update_expenses',
      description:
        'Update the user\'s monthly expense amounts to help reduce spending and improve their car affordability. Only call this when the user asks to cut costs or update expenses.',
      parameters: {
        type: 'object',
        properties: {
          groceries: { type: 'number', description: 'New monthly grocery budget in rands' },
          accounts: { type: 'number', description: 'New monthly accounts/subscriptions in rands' },
          loans: { type: 'number', description: 'New monthly loan repayments in rands' },
          other: { type: 'number', description: 'New monthly other expenses in rands' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_profile',
      description:
        'Update the user\'s profile details such as their salary or province. Only call when the user explicitly provides new values.',
      parameters: {
        type: 'object',
        properties: {
          netSalary: { type: 'number', description: 'Updated monthly net salary in rands' },
          location: {
            type: 'string',
            enum: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'],
            description: 'Updated province',
          },
          yearsLicensed: { type: 'number', description: 'Years the user has held a driver\'s licence' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_affordable_cars',
      description:
        'Trigger a fresh car search based on the user\'s current or updated budget and preferences. Call this when the user asks to find cars, see what they can afford, or after updating their finances.',
      parameters: {
        type: 'object',
        properties: {
          budget: { type: 'number', description: 'Monthly car budget in rands (loan + insurance + fuel + maintenance)' },
          carType: { type: 'string', description: 'Preferred car type e.g. sedan, SUV, hatchback' },
          fuelType: { type: 'string', description: 'Preferred fuel type e.g. petrol, diesel, hybrid, electric' },
          transmission: { type: 'string', description: 'Preferred transmission e.g. automatic, manual' },
        },
        required: ['budget'],
      },
    },
  },
];

@Injectable()
export class AiAdvisorService {
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async chat(dto: ChatAdvisorDto): Promise<{ reply: string; actions: AdvisorAction[] }> {
    const { messages, financialContext: fc, preferredCar: pc } = dto;

    const carSection = pc
      ? `
## Selected Car
The user has chosen the **${pc.year ?? ''} ${pc.make} ${pc.model}**.
- **Purchase price:** R ${(pc.price ?? 0).toLocaleString('en-ZA')}${pc.mileage ? ` | **Mileage:** ${pc.mileage.toLocaleString('en-ZA')} km` : ''}${pc.fuelType ? ` | **Fuel:** ${pc.fuelType}` : ''}${pc.transmission ? ` | **Transmission:** ${pc.transmission}` : ''}
- **Monthly breakdown:** Loan R ${pc.loanCost.toLocaleString('en-ZA')} | Insurance R ${pc.insuranceCost.toLocaleString('en-ZA')} | Fuel R ${pc.fuelCost.toLocaleString('en-ZA')} | Maintenance R ${pc.maintenanceCost.toLocaleString('en-ZA')}
- **Total: R ${pc.estimatedMonthlyCost.toLocaleString('en-ZA')}** (budget: R ${fc.carBudget.toLocaleString('en-ZA')}) — ${pc.estimatedMonthlyCost <= fc.carBudget ? `R ${(fc.carBudget - pc.estimatedMonthlyCost).toLocaleString('en-ZA')} under budget` : `R ${(pc.estimatedMonthlyCost - fc.carBudget).toLocaleString('en-ZA')} over budget`}`
      : '';

    const systemPrompt = `You are a friendly South African personal finance advisor specialising in car affordability.

## User's Financial Profile
- **Monthly net salary:** R ${fc.netSalary.toLocaleString('en-ZA')}
- **Expenses:** Groceries R ${fc.expenses.groceries.toLocaleString('en-ZA')} | Accounts R ${fc.expenses.accounts.toLocaleString('en-ZA')} | Loans R ${fc.expenses.loans.toLocaleString('en-ZA')} | Other R ${fc.expenses.other.toLocaleString('en-ZA')} | **Total R ${fc.totalExpenses.toLocaleString('en-ZA')}**
- **Disposable income:** R ${fc.disposableIncome.toLocaleString('en-ZA')}
- **Monthly car budget (20% rule):** R ${fc.carBudget.toLocaleString('en-ZA')}
- **DTI:** ${(fc.dtiRatio * 100).toFixed(1)}%${fc.creditScore ? ` | **Credit score:** ${fc.creditScore}` : ''}
- **Province:** ${fc.location || 'Not specified'}
${carSection}

## What you can do
You have access to three tools:
- **update_expenses**: reduce expense categories to improve affordability — use when user asks to cut costs or trim spending
- **update_profile**: update salary, province or years licensed — use when user gives you new values
- **search_affordable_cars**: trigger a new car search — use when user wants to see what cars they can afford, or after updating finances

## Guidelines
- Be concise and warm. Use plain language.
- Always reference the user's actual rand amounts.
- When suggesting expense cuts, be specific (e.g. "cut groceries from R X to R Y").
- After calling a tool, explain what changed and the impact on their budget.
- Mention SA options: Discovery Insure, WiMi, FNB/Standard Bank vehicle finance where relevant.
- Keep responses short — 2–4 paragraphs unless asked for more detail.`;

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    // First call — may include tool calls
    const firstResponse = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      tools: TOOLS,
      tool_choice: 'auto',
      messages: openaiMessages,
    });

    const firstChoice = firstResponse.choices[0];
    const actions: AdvisorAction[] = [];

    // No tool calls — return plain reply
    if (!firstChoice.message.tool_calls || firstChoice.message.tool_calls.length === 0) {
      return { reply: firstChoice.message.content?.trim() ?? '', actions };
    }

    // Execute each tool call and build tool result messages
    const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    toolMessages.push(firstChoice.message as OpenAI.Chat.ChatCompletionMessageParam);

    for (const toolCall of firstChoice.message.tool_calls) {
      if (toolCall.type !== 'function') continue;
      const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      let toolResult = '';

      if (toolCall.function.name === 'update_expenses') {
        const action: AdvisorAction = {
          type: 'update_expenses',
          groceries: args.groceries as number | undefined,
          accounts: args.accounts as number | undefined,
          loans: args.loans as number | undefined,
          other: args.other as number | undefined,
        };
        actions.push(action);

        const newTotal = [
          (args.groceries as number | undefined) ?? fc.expenses.groceries,
          (args.accounts as number | undefined) ?? fc.expenses.accounts,
          (args.loans as number | undefined) ?? fc.expenses.loans,
          (args.other as number | undefined) ?? fc.expenses.other,
        ].reduce((a, b) => a + b, 0);
        const newBudget = (fc.netSalary - newTotal) * 0.2;
        toolResult = `Expenses updated. New total: R ${newTotal.toLocaleString('en-ZA')}. New monthly car budget: R ${Math.round(newBudget).toLocaleString('en-ZA')}.`;
      } else if (toolCall.function.name === 'update_profile') {
        const action: AdvisorAction = {
          type: 'update_profile',
          netSalary: args.netSalary as number | undefined,
          location: args.location as string | undefined,
          yearsLicensed: args.yearsLicensed as number | undefined,
        };
        actions.push(action);
        const salary = (args.netSalary as number | undefined) ?? fc.netSalary;
        const newBudget = (salary - fc.totalExpenses) * 0.2;
        toolResult = `Profile updated. Monthly car budget is now R ${Math.round(newBudget).toLocaleString('en-ZA')}.`;
      } else if (toolCall.function.name === 'search_affordable_cars') {
        const action: AdvisorAction = {
          type: 'search_cars',
          budget: args.budget as number,
          carType: args.carType as string | undefined,
          fuelType: args.fuelType as string | undefined,
          transmission: args.transmission as string | undefined,
        };
        actions.push(action);
        toolResult = `Car search triggered with a budget of R ${(args.budget as number).toLocaleString('en-ZA')} per month. Results will appear on screen.`;
      }

      toolMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult,
      });
    }

    // Second call with tool results for final response
    const finalResponse = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [...openaiMessages, ...toolMessages],
    });

    const reply = finalResponse.choices[0]?.message?.content?.trim() ?? '';
    return { reply, actions };
  }
}
