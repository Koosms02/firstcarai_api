import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        fullName: dto.fullName,
        idNumber: dto.idNumber,
        netSalary: dto.netSalary,
        creditScore: dto.creditScore,
        yearsLicensed: dto.yearsLicensed,
        gender: dto.gender,
        location: dto.location,
      },
    });

    return { access_token: this.sign(user) };
  }

  async signin(dto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return { access_token: this.sign(user) };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Always respond the same way so we don't reveal whether an email is registered
    if (!user) {
      return { message: 'If this email is registered, a reset code has been generated.' };
    }

    // Generate a 6-digit numeric code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(resetCode, 10);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordResetToken: hashedCode, passwordResetExpiry: expiry },
    });

    // In production this code would be sent via email.
    // Returned here for development purposes only.
    return {
      message: 'Reset code generated. In production this would be sent to your email.',
      resetCode,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user?.passwordResetToken || !user?.passwordResetExpiry) {
      throw new BadRequestException('No password reset was requested for this email.');
    }

    if (new Date() > user.passwordResetExpiry) {
      throw new BadRequestException('The reset code has expired. Please request a new one.');
    }

    const valid = await bcrypt.compare(dto.resetCode, user.passwordResetToken);
    if (!valid) throw new BadRequestException('Invalid reset code.');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
    });

    return { message: 'Password reset successfully. You can now sign in.' };
  }

  private sign(user: { id: string; email: string; role: string }) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
