import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreatePreferenceDto } from './dto/create-preference.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto): Promise<{
        id: string;
        createdAt: Date | null;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        fullName: string | null;
        idNumber: string | null;
        netSalary: import("@prisma/client-runtime-utils").Decimal | null;
        creditScore: number | null;
        yearsLicensed: number | null;
        gender: string | null;
        location: string | null;
        passwordResetToken: string | null;
        passwordResetExpiry: Date | null;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date | null;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        fullName: string | null;
        idNumber: string | null;
        netSalary: import("@prisma/client-runtime-utils").Decimal | null;
        creditScore: number | null;
        yearsLicensed: number | null;
        gender: string | null;
        location: string | null;
    }[]>;
    findOne(id: string): Promise<{
        preferences: {
            id: string;
            fuelType: string | null;
            transmission: string | null;
            createdAt: Date | null;
            userId: string | null;
            preferredBrand: string | null;
            carType: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date | null;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        fullName: string | null;
        idNumber: string | null;
        netSalary: import("@prisma/client-runtime-utils").Decimal | null;
        creditScore: number | null;
        yearsLicensed: number | null;
        gender: string | null;
        location: string | null;
        passwordResetToken: string | null;
        passwordResetExpiry: Date | null;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        createdAt: Date | null;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        fullName: string | null;
        idNumber: string | null;
        netSalary: import("@prisma/client-runtime-utils").Decimal | null;
        creditScore: number | null;
        yearsLicensed: number | null;
        gender: string | null;
        location: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date | null;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        fullName: string | null;
        idNumber: string | null;
        netSalary: import("@prisma/client-runtime-utils").Decimal | null;
        creditScore: number | null;
        yearsLicensed: number | null;
        gender: string | null;
        location: string | null;
        passwordResetToken: string | null;
        passwordResetExpiry: Date | null;
    }>;
    upsertPreferences(userId: string, dto: CreatePreferenceDto): Promise<{
        id: string;
        fuelType: string | null;
        transmission: string | null;
        createdAt: Date | null;
        userId: string | null;
        preferredBrand: string | null;
        carType: string | null;
    }>;
}
