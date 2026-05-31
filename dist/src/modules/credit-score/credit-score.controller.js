"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditScoreController = void 0;
const common_1 = require("@nestjs/common");
const credit_score_service_1 = require("./credit-score.service");
const check_credit_score_dto_1 = require("./dto/check-credit-score.dto");
const mock_credit_score_dto_1 = require("./dto/mock-credit-score.dto");
let CreditScoreController = class CreditScoreController {
    creditScoreService;
    constructor(creditScoreService) {
        this.creditScoreService = creditScoreService;
    }
    checkCreditScore(dto) {
        return this.creditScoreService.calculateCreditScore(dto);
    }
    getMockCreditScore(dto) {
        return this.creditScoreService.getMockCreditScore(dto);
    }
};
exports.CreditScoreController = CreditScoreController;
__decorate([
    (0, common_1.Post)('check'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_credit_score_dto_1.CheckCreditScoreDto]),
    __metadata("design:returntype", void 0)
], CreditScoreController.prototype, "checkCreditScore", null);
__decorate([
    (0, common_1.Post)('mock'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mock_credit_score_dto_1.MockCreditScoreDto]),
    __metadata("design:returntype", void 0)
], CreditScoreController.prototype, "getMockCreditScore", null);
exports.CreditScoreController = CreditScoreController = __decorate([
    (0, common_1.Controller)('credit-score'),
    __metadata("design:paramtypes", [credit_score_service_1.CreditScoreService])
], CreditScoreController);
//# sourceMappingURL=credit-score.controller.js.map