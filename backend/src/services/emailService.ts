import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

export class EmailService {
  private static transporter: nodemailer.Transporter;

  /**
   * Initialize email transporter
   */
  static initialize() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // true for 465, false for other ports
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    logger.info('Email service initialized');
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string
  ): Promise<void> {
    try {
      const resetUrl = `${process.env.DASHBOARD_URL}/reset-password?token=${resetToken}`;

      // For debugging purposes, log the reset information
      logger.info(`Password reset requested for: ${email}`);
      logger.info(`Reset token: ${resetToken}`);
      logger.info(`Reset URL: ${resetUrl}`);
      logger.info(`User: ${userName}`);

      // Send actual email
      const mailOptions = {
        from: `"ISI Archive" <${process.env.SMTP_MAIL}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe - ISI Archive',
        html: this.getPasswordResetEmailTemplate(userName, resetUrl),
      };

      await this.transporter.sendMail(mailOptions);
      
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  }

  /**
   * Get password reset email template
   */
  private static getPasswordResetEmailTemplate(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .app-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin: 10px 0;
          }
          .title {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content {
            color: #4b5563;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            border: none;
          }
          .button:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
            color: white !important;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .link {
            color: #1e40af;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="app-name">🎓 ISI Archive</div>
            <h1 class="title">Réinitialisation de votre mot de passe</h1>
          </div>
          
          <div class="content">
            <p>Bonjour <strong>${userName}</strong>,</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte ISI Archive.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button" style="color: white !important;">Réinitialiser mon mot de passe</a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p class="link">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul>
                <li>Ce lien est valide pendant <strong>1 heure</strong> seulement</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Votre mot de passe actuel reste inchangé tant que vous n'en créez pas un nouveau</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par ISI Archive.</p>
            <p>© 2024 Institut Supérieur d'Informatique de Tunis</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test email configuration
   */
  static async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
} 