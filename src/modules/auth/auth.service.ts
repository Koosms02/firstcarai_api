import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/** Digits 6-9 of SA ID: 0000–4999 = female, 5000–9999 = male */
function extractGenderFromId(idNumber: string): string | null {
  if (!idNumber || idNumber.length < 10) return null;
  const genderDigits = parseInt(idNumber.substring(6, 10), 10);
  if (isNaN(genderDigits)) return null;
  return genderDigits >= 5000 ? 'male' : 'female';
}

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
    const gender = extractGenderFromId(dto.idNumber);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        idNumber: dto.idNumber,
        gender,
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
      return { resetPath: null };
    }

    // Generate a UUID token, store its bcrypt hash (never store raw token)
    const token = randomUUID();
    const hashedToken = await bcrypt.hash(token, 10);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordResetToken: hashedToken, passwordResetExpiry: expiry },
    });

    // Return the path so the frontend can build the full URL.
    // In production this URL would be emailed to the user.
    const encodedEmail = encodeURIComponent(dto.email);
    return { resetPath: `/r/${encodedEmail}/${token}` };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user?.passwordResetToken || !user?.passwordResetExpiry) {
      throw new BadRequestException('No password reset was requested for this email.');
    }

    if (new Date() > user.passwordResetExpiry) {
      throw new BadRequestException('The reset code has expired. Please request a new one.');
    }

    const valid = await bcrypt.compare(dto.token, user.passwordResetToken);
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
