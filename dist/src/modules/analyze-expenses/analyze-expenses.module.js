"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeExpensesModule = void 0;
const common_1 = require("@nestjs/common");
const analyze_expenses_controller_1 = require("./analyze-expenses.controller");
const analyze_expenses_service_1 = require("./analyze-expenses.service");
let AnalyzeExpensesModule = class AnalyzeExpensesModule {
};
exports.AnalyzeExpensesModule = AnalyzeExpensesModule;
exports.AnalyzeExpensesModule = AnalyzeExpensesModule = __decorate([
    (0, common_1.Module)({
        controllers: [analyze_expenses_controller_1.AnalyzeExpensesController],
        providers: [analyze_expenses_service_1.AnalyzeExpensesService],
    })
], AnalyzeExpensesModule);
//# sourceMappingURL=analyze-expenses.module.js.map