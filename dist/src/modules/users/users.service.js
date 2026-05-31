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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const profileFields = {
            fullName: dto.fullName,
            idNumber: dto.idNumber,
            netSalary: dto.netSalary,
            creditScore: dto.creditScore,
            yearsLicensed: dto.yearsLicensed,
            gender: dto.gender,
            location: dto.location,
        };
        return this.prisma.user.upsert({
            where: { email: dto.email },
            update: profileFields,
            create: { email: dto.email, password: '', ...profileFields },
        });
    }
    async findAll() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                fullName: true,
                idNumber: true,
                netSalary: true,
                creditScore: true,
                yearsLicensed: true,
                gender: true,
                location: true,
                createdAt: true,
            },
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { preferences: true },
        });
        if (!user)
            throw new common_1.NotFoundException(`User ${id} not found`);
        return user;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true,
                email: true,
                role: true,
                fullName: true,
                idNumber: true,
                netSalary: true,
                creditScore: true,
                yearsLicensed: true,
                gender: true,
                location: true,
                createdAt: true,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.user.delete({ where: { id } });
    }
    async upsertPreferences(userId, dto) {
        await this.findOne(userId);
        const existingPreference = await this.prisma.userPreference.findFirst({
            where: { userId },
        });
        if (existingPreference) {
            return this.prisma.userPreference.update({
                where: { id: existingPreference.id },
                data: dto,
            });
        }
        return this.prisma.userPreference.create({
            data: { userId, ...dto },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map