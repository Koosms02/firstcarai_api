export declare class ExpensesDto {
    groceries: number;
    accounts: number;
    loans: number;
    other?: number;
}
export declare class CheckCreditScoreDto {
    idNumber: string;
    income: number;
    expenses: ExpensesDto;
}
