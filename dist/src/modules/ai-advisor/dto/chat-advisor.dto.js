"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatAdvisorResponseDto = exports.ChatAdvisorDto = exports.PreferredCarDto = exports.FinancialContextDto = exports.ChatMessageDto = void 0;
class ChatMessageDto {
    role;
    content;
}
exports.ChatMessageDto = ChatMessageDto;
class FinancialContextDto {
    netSalary;
    expenses;
    totalExpenses;
    disposableIncome;
    carBudget;
    dtiRatio;
    creditScore;
    location;
}
exports.FinancialContextDto = FinancialContextDto;
class PreferredCarDto {
    make;
    model;
    year;
    price;
    fuelType;
    transmission;
    mileage;
    loanCost;
    insuranceCost;
    fuelCost;
    maintenanceCost;
    estimatedMonthlyCost;
}
exports.PreferredCarDto = PreferredCarDto;
class ChatAdvisorDto {
    messages;
    financialContext;
    preferredCar;
}
exports.ChatAdvisorDto = ChatAdvisorDto;
class ChatAdvisorResponseDto {
    reply;
    actions;
}
exports.ChatAdvisorResponseDto = ChatAdvisorResponseDto;
//# sourceMappingURL=chat-advisor.dto.js.map