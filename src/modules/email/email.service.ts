import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private resend: any | null = null;
  private readonly fromAddress: string;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress = process.env.EMAIL_FROM || 'FirstCar <noreply@firstcar.co.za>';
    if (apiKey) {
      // Lazy-load Resend only when a key is configured
      import('resend').then(({ Resend }) => {
        this.resend = new Resend(apiKey);
        this.logger.log('Resend email client initialised');
      }).catch((err) => {
        this.logger.warn(`Resend module not available: ${err.message}`);
      });
    } else {
      this.logger.warn('RESEND_API_KEY not set — email sending is disabled');
    }
  }

  isAvailable(): boolean {
    return this.resend !== null;
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Cannot send reset email to ${to} — Resend not configured`);
      throw new Error('Email service is not configured.');
    }

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject: 'Reset your FirstCar password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a1a1a; margin-bottom: 16px;">Reset your password</h2>
          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
            We received a request to reset your FirstCar account password. Click the button below to choose a new password.
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; margin: 24px 0; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
            Reset password
          </a>
          <p style="color: #9a9a9a; font-size: 12px; line-height: 1.5;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Failed to send reset email to ${to}: ${error.message}`);
      throw new Error('Failed to send password reset email.');
    }

    this.logger.log(`Password reset email sent to ${to}`);
  }
}
