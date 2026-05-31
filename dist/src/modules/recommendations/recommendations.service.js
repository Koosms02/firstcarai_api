"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
const LOAN_TERM_MONTHS = 60;
const AFFORDABILITY_RATIO = 0.20;
const MONTHLY_DISTANCE_KM = 1200;
const FUEL_PRICE_PER_LITRE = 22;
const TOP_N = 10;
function extractAgeFromId(idNumber) {
    if (!idNumber || idNumber.length < 6)
        return null;
    const yy = parseInt(idNumber.substring(0, 2), 10);
    const mm = parseInt(idNumber.substring(2, 4), 10);
    const dd = parseInt(idNumber.substring(4, 6), 10);
    if (isNaN(yy) || isNaN(mm) || isNaN(dd))
        return null;
    const currentYY = new Date().getFullYear() % 100;
    const birthYear = yy <= currentYY ? 2000 + yy : 1900 + yy;
    const today = new Date();
    const birthDate = new Date(birthYear, mm - 1, dd);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
        age--;
    return age;
}
function calcMonthlyLoan(price) {
    return price / LOAN_TERM_MONTHS;
}
function calcFuelCost(fuelEfficiency, fuelType) {
    if (fuelEfficiency && fuelEfficiency > 0) {
        return (MONTHLY_DISTANCE_KM / 100) * fuelEfficiency * FUEL_PRICE_PER_LITRE;
    }
    switch (fuelType?.toLowerCase()) {
        case 'electric': return 500;
        case 'hybrid': return (MONTHLY_DISTANCE_KM / 100) * 4.5 * FUEL_PRICE_PER_LITRE;
        case 'diesel': return (MONTHLY_DISTANCE_KM / 100) * 7.5 * FUEL_PRICE_PER_LITRE;
        default: return (MONTHLY_DISTANCE_KM / 100) * 9.0 * FUEL_PRICE_PER_LITRE;
    }
}
function calcMaintenanceCost(price) {
    return (price * 0.01) / 12;
}
function creditScoreToRiskCategory(creditScore) {
    if (creditScore >= 700)
        return 'low';
    if (creditScore >= 600)
        return 'medium';
    return 'high';
}
function lookupInsuranceCost(insuranceEstimates, price, userLocation, creditScore) {
    const riskCategory = creditScoreToRiskCategory(creditScore);
    const userProv = userLocation?.toLowerCase() ?? '';
    const match = insuranceEstimates.find(e => {
        const estProv = e.location?.toLowerCase() ?? '';
        return estProv === userProv && e.riskCategory === riskCategory;
    });
    if (match)
        return Number(match.estimatedMonthly);
    const sameTier = insuranceEstimates.filter(e => e.riskCategory === riskCategory);
    if (sameTier.length > 0) {
        const avg = sameTier.reduce((sum, e) => sum + Number(e.estimatedMonthly), 0) / sameTier.length;
        return avg;
    }
    return (price * 0.025) / 12;
}
let RecommendationsService = class RecommendationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generate(dto) {
        let netSalary;
        let creditScore;
        let preference = null;
        let userLocation = null;
        let idNumber = null;
        if (dto.userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: dto.userId },
                include: { preferences: true },
            });
            if (!user)
                throw new common_1.NotFoundException(`User ${dto.userId} not found`);
            if (!user.netSalary || !user.creditScore) {
                throw new common_1.NotFoundException('User must have netSalary and creditScore set');
            }
            netSalary = Number(user.netSalary);
            creditScore = user.creditScore;
            preference = user.preferences[0] ?? null;
            userLocation = user.location;
            idNumber = user.idNumber ?? null;
        }
        else {
            if (!dto.netSalary || !dto.creditScore) {
                throw new common_1.NotFoundException('Guest must provide netSalary and creditScore');
            }
            netSalary = Number(dto.netSalary);
            creditScore = Number(dto.creditScore);
            preference = dto.preferences ?? null;
            userLocation = dto.location ?? null;
            idNumber = dto.idNumber ?? null;
        }
        const affordableBudget = netSalary * AFFORDABILITY_RATIO;
        const age = idNumber ? extractAgeFromId(idNumber) : null;
        const cars = await this.prisma.car.findMany({
            include: { insuranceEstimates: true },
        });
        const scored = cars
            .filter(car => car.price !== null)
            .map(car => {
            const price = Number(car.price);
            const fuelEff = car.fuelEfficiency ? Number(car.fuelEfficiency) : null;
            const loanCost = calcMonthlyLoan(price);
            const insuranceCost = lookupInsuranceCost(car.insuranceEstimates, price, userLocation, creditScore);
            const fuelCost = calcFuelCost(fuelEff, car.fuelType);
            const maintenanceCost = calcMaintenanceCost(price);
            const estimatedMonthlyCost = loanCost + insuranceCost + fuelCost + maintenanceCost;
            if (estimatedMonthlyCost > affordableBudget)
                return null;
            let preferenceScore = 0;
            if (preference) {
                if (preference.preferredBrand && car.make?.toLowerCase().includes(preference.preferredBrand.toLowerCase()))
                    preferenceScore++;
                if (preference.fuelType && car.fuelType?.toLowerCase() === preference.fuelType.toLowerCase())
                    preferenceScore++;
                if (preference.transmission && car.transmission?.toLowerCase() === preference.transmission.toLowerCase())
                    preferenceScore++;
                if (preference.carType)
                    preferenceScore++;
            }
            const affordabilityScore = 1 - estimatedMonthlyCost / netSalary;
            const finalScore = affordabilityScore * 0.7 + (preferenceScore / 4) * 0.3;
            return {
                car,
                estimatedMonthlyCost,
                insuranceCost,
                loanCost,
                maintenanceCost,
                fuelCost,
                score: finalScore,
            };
        })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score)
            .slice(0, TOP_N);
        if (dto.userId) {
            await this.prisma.recommendation.deleteMany({ where: { userId: dto.userId } });
            const saved = await Promise.all(scored.map(r => this.prisma.recommendation.create({
                data: {
                    userId: dto.userId,
                    carId: r.car.id,
                    estimatedMonthlyCost: r.estimatedMonthlyCost,
                    insuranceCost: r.insuranceCost,
                    loanCost: r.loanCost,
                    maintenanceCost: r.maintenanceCost,
                    fuelCost: r.fuelCost,
                    score: r.score,
                },
                include: { car: true },
            })));
            return saved;
        }
        else {
            return scored.map(r => ({
                id: crypto.randomUUID(),
                userId: null,
                carId: r.car.id,
                estimatedMonthlyCost: r.estimatedMonthlyCost,
                insuranceCost: r.insuranceCost,
                loanCost: r.loanCost,
                maintenanceCost: r.maintenanceCost,
                fuelCost: r.fuelCost,
                score: r.score,
                createdAt: new Date(),
                car: r.car,
            }));
        }
    }
    async findByUser(userId) {
        return this.prisma.recommendation.findMany({
            where: { userId },
            include: { car: true },
            orderBy: { score: 'desc' },
        });
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map