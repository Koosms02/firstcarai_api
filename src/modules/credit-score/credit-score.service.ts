import { Injectable } from '@nestjs/common';
import { CheckCreditScoreDto } from './dto/check-credit-score.dto';
import { MockCreditScoreDto } from './dto/mock-credit-score.dto';

@Injectable()
export class CreditScoreService {
  calculateCreditScore(dto: CheckCreditScoreDto) {
    const { idNumber, income, expenses } = dto;
    const totalExpenses =
      expenses.groceries +
      expenses.accounts +
      expenses.loans +
      (expenses.other || 0);

    const disposableIncome = income - totalExpenses;
    
    // Mock logic based on ID Number to generate a deterministic score between 300 and 850
    // Sum digits of ID number and use it to seed the score
    let idSum = 0;
    for (let i = 0; i < idNumber.length; i++) {
      const charCode = idNumber.charCodeAt(i);
      idSum += charCode;
    }

    // Base score from ID (e.g. 500 to 700)
    let baseScore = 500 + (idSum % 200);

    // Adjust based on debt-to-income ratio (DTI)
    const dti = income > 0 ? totalExpenses / income : 1;

    let scoreAdjustment = 0;
    if (dti < 0.2) {
      scoreAdjustment = 100; // Excellent
    } else if (dti < 0.4) {
      scoreAdjustment = 50;  // Good
    } else if (dti < 0.6) {
      scoreAdjustment = 0;   // Fair
    } else if (dti < 0.8) {
      scoreAdjustment = -50; // Poor
    } else {
      scoreAdjustment = -100; // Very Poor
    }

    let finalScore = baseScore + scoreAdjustment;

    // Cap between 300 and 850
    if (finalScore < 300) finalScore = 300;
    if (finalScore > 850) finalScore = 850;

    let rating = 'Fair';
    if (finalScore >= 750) rating = 'Excellent';
    else if (finalScore >= 700) rating = 'Good';
    else if (finalScore >= 650) rating = 'Fair';
    else if (finalScore >= 600) rating = 'Poor';
    else rating = 'Very Poor';

    const isAffordable = disposableIncome > (income * 0.1); // Can afford a car if they have 10% of income remaining

    return {
      idNumber,
      creditScore: finalScore,
      rating,
      income,
      totalExpenses,
      disposableIncome,
      affordability: isAffordable ? 'Approved' : 'Declined',
      maxInstallment: isAffordable ? disposableIncome * 0.8 : 0, // Mock: can spend 80% of disposable income on installment
    };
  }

  getMockCreditScore(dto: MockCreditScoreDto) {
    const { idNumber } = dto;

    // Deterministic hash — same ID always returns the same score
    let hash = 0;
    for (let i = 0; i < idNumber.length; i++) {
      hash = (hash * 31 + idNumber.charCodeAt(i)) >>> 0;
    }

    // Map the 32-bit hash into the South African credit score range (330–850)
    const RANGE = 850 - 330;
    const creditScore = 330 + (hash % (RANGE + 1));

    let rating: string;
    if (creditScore >= 750) rating = 'Excellent';
    else if (creditScore >= 700) rating = 'Good';
    else if (creditScore >= 650) rating = 'Fair';
    else if (creditScore >= 600) rating = 'Poor';
    else rating = 'Very Poor';

    return { idNumber, creditScore, rating };
  }
}
