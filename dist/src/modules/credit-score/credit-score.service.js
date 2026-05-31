"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditScoreService = void 0;
const common_1 = require("@nestjs/common");
let CreditScoreService = class CreditScoreService {
    calculateCreditScore(dto) {
        const { idNumber, income, expenses } = dto;
        const totalExpenses = expenses.groceries +
            expenses.accounts +
            expenses.loans +
            (expenses.other || 0);
        const disposableIncome = income - totalExpenses;
        let idSum = 0;
        for (let i = 0; i < idNumber.length; i++) {
            const charCode = idNumber.charCodeAt(i);
            idSum += charCode;
        }
        let baseScore = 500 + (idSum % 200);
        const dti = income > 0 ? totalExpenses / income : 1;
        let scoreAdjustment = 0;
        if (dti < 0.2) {
            scoreAdjustment = 100;
        }
        else if (dti < 0.4) {
            scoreAdjustment = 50;
        }
        else if (dti < 0.6) {
            scoreAdjustment = 0;
        }
        else if (dti < 0.8) {
            scoreAdjustment = -50;
        }
        else {
            scoreAdjustment = -100;
        }
        let finalScore = baseScore + scoreAdjustment;
        if (finalScore < 300)
            finalScore = 300;
        if (finalScore > 850)
            finalScore = 850;
        let rating = 'Fair';
        if (finalScore >= 750)
            rating = 'Excellent';
        else if (finalScore >= 700)
            rating = 'Good';
        else if (finalScore >= 650)
            rating = 'Fair';
        else if (finalScore >= 600)
            rating = 'Poor';
        else
            rating = 'Very Poor';
        const isAffordable = disposableIncome > (income * 0.1);
        return {
            idNumber,
            creditScore: finalScore,
            rating,
            income,
            totalExpenses,
            disposableIncome,
            affordability: isAffordable ? 'Approved' : 'Declined',
            maxInstallment: isAffordable ? disposableIncome * 0.8 : 0,
        };
    }
    getMockCreditScore(dto) {
        const { idNumber } = dto;
        let hash = 0;
        for (let i = 0; i < idNumber.length; i++) {
            hash = (hash * 31 + idNumber.charCodeAt(i)) >>> 0;
        }
        const RANGE = 850 - 330;
        const creditScore = 330 + (hash % (RANGE + 1));
        let rating;
        if (creditScore >= 750)
            rating = 'Excellent';
        else if (creditScore >= 700)
            rating = 'Good';
        else if (creditScore >= 650)
            rating = 'Fair';
        else if (creditScore >= 600)
            rating = 'Poor';
        else
            rating = 'Very Poor';
        return { idNumber, creditScore, rating };
    }
};
exports.CreditScoreService = CreditScoreService;
exports.CreditScoreService = CreditScoreService = __decorate([
    (0, common_1.Injectable)()
], CreditScoreService);
//# sourceMappingURL=credit-score.service.js.map