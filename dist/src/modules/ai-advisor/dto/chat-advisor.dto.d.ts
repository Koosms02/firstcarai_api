export declare class ChatMessageDto {
    role: 'user' | 'assistant';
    content: string;
}
export declare class FinancialContextDto {
    netSalary: number;
    expenses: {
        groceries: number;
        accounts: number;
        loans: number;
        other: number;
    };
    totalExpenses: number;
    disposableIncome: number;
    carBudget: number;
    dtiRatio: number;
    creditScore: number | null;
    location: string;
}
export declare class PreferredCarDto {
    make: string;
    model: string;
    year: number | null;
    price: number | null;
    fuelType: string | null;
    transmission: string | null;
    mileage: number | null;
    loanCost: number;
    insuranceCost: number;
    fuelCost: number;
    maintenanceCost: number;
    estimatedMonthlyCost: number;
}
export declare class ChatAdvisorDto {
    messages: ChatMessageDto[];
    financialContext: FinancialContextDto;
    preferredCar?: PreferredCarDto;
}
export declare class ChatAdvisorResponseDto {
    reply: string;
    actions: unknown[];
}
