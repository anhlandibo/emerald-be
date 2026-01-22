import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>(
      'SMTP_HOST',
      'smtp.gmail.com',
    );
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    const smtpFrom = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@emerald.com',
    );

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      from: smtpFrom,
    });

    this.logger.debug(
      `Email service initialized with SMTP: ${smtpHost}:${smtpPort}`,
    );
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const mailOptions: SendMailOptions = {
        from: this.configService.get<string>(
          'SMTP_FROM',
          'noreply@emerald.com',
        ),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);

      const messageId =
        result && typeof result === 'object' && 'messageId' in result
          ? (result as unknown as { messageId?: string }).messageId
          : 'unknown';

      this.logger.log(`Email sent successfully. Message ID: ${messageId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : '',
      );
      return false;
    }
  }

  async sendEmailToMultiple(
    recipients: string[],
    subject: string,
    html: string,
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to: recipient,
        subject,
        html,
      });

      if (result) {
        successful.push(recipient);
      } else {
        failed.push(recipient);
      }
    }

    return { successful, failed };
  }

  buildNotificationEmail(
    title: string,
    content: string,
    recipientName?: string,
  ): string {
    const recipientGreeting = recipientName
      ? `Kính gửi ${recipientName},`
      : 'Kính gửi quý cư dân,';

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #244B35;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #244B35;
            font-size: 24px;
          }
          .content {
            margin: 20px 0;
          }
          .greeting {
            font-size: 14px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            color: #244B35;
            margin: 15px 0 10px 0;
          }
          .message {
            font-size: 14px;
            line-height: 1.8;
            color: #555;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 15px;
            margin-top: 20px;
            font-size: 12px;
            color: #999;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thông Báo Từ Quản Lý Chung Cư Emerald</h1>
          </div>
          
          <div class="content">
            <div class="greeting">${recipientGreeting}</div>
            
            <div class="title">${title}</div>
            
            <div class="message">${content}</div>
          </div>
          
          <div class="footer">
            <p>Đây là thư tự động từ hệ thống quản lý chung cư Emerald.</p>
            <p>Vui lòng không trả lời email này.</p>
            <p>&copy; 2025 Emerald Apartment Management. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
