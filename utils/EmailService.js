const nodemailer = require('nodemailer');

// Initialize Nodemailer transporter with SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

/**
 * Generic email sender
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EmailService] SMTP credentials not configured in .env. Skipping actual mail dispatch to: ${to}`);
    console.log(`[EmailService] Subject: ${subject}`);
    console.log(`[EmailService] Text:\n${text}`);
    return { success: false, reason: 'SMTP not configured' };
  }

  return transporter.sendMail({
    from: `"School ERP Administration" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

/**
 * HTML Email Template Generator (Universal Clean & Premium Layout)
 * Uses 100% Inline CSS for maximum webmail compatibility (Gmail, Yopmail, Outlook, Yahoo)
 */
const generateEmailTemplate = (content, title = 'School Portal Credentials') => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 30px 10px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 20px; border-bottom: 3px solid #f59e0b;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #f59e0b; width: 42px; height: 42px; border-radius: 10px; display: inline-block; text-align: center; line-height: 42px; font-weight: bold; color: #0f172a; font-size: 20px; vertical-align: middle; margin-right: 10px;">
                                            🎓
                                        </div>
                                        <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; vertical-align: middle;">School ERP</span>
                                        <span style="color: #f59e0b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 4px;">Master Control Portal</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 28px; color: #334155; font-size: 15px; line-height: 1.6;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
                            <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">School ERP System Administration</p>
                            <p style="margin: 0;">&copy; ${new Date().getFullYear()} All rights reserved. Do not reply to this automated email.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

/**
 * Send welcome credentials to a newly created School
 */
const sendNewSchoolCredentialsEmail = async ({ email, password, schoolName, code, loginUrl }) => {
  const portalUrl = loginUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

  const textMessage = `
Hello ${schoolName},

Your school portal account has been created successfully.

School Code: ${code}
Email: ${email}
Password: ${password}

Portal Login URL: ${portalUrl}/login

Please log in and change your password upon your first login for security reasons.

Regards,
Super Admin Team
  `;

  const htmlContent = `
    <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Welcome, ${schoolName}!</h2>
    <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px;">Your tenant school portal account has been registered successfully by the Super Admin. You can now access your administration portal using the credentials below:</p>

    <!-- Credentials Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #f59e0b; border-radius: 12px; margin: 20px 0;">
        <tr>
            <td style="padding: 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td width="130" style="padding: 6px 0; font-weight: 600; color: #64748b; font-size: 14px;">School Code:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #b45309; font-family: monospace; font-size: 15px;">${code}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b; font-size: 14px;">Login Email:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 15px;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: 600; color: #64748b; font-size: 14px;">Temp Password:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #047857; font-family: monospace; font-size: 16px;"><span style="background-color: #d1fae5; color: #047857; padding: 4px 10px; border-radius: 6px; border: 1px solid #a7f3d0;">${password}</span></td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Call to Action Button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 20px 0;">
        <tr>
            <td align="center">
                <a href="${portalUrl}/login" target="_blank" style="background-color: #d97706; background-image: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);">
                    🚀 Login to School Portal
                </a>
            </td>
        </tr>
    </table>

    <p style="margin: 20px 0 0 0; color: #94a3b8; font-size: 13px; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 16px;">
        🔒 For security reasons, please change your password in profile settings after your first login.
    </p>
  `;

  const htmlMessage = generateEmailTemplate(htmlContent, `Welcome to School ERP - ${schoolName}`);

  try {
    await sendEmail({
      to: email,
      subject: `[School Credentials] Welcome to School ERP - ${schoolName}`,
      text: textMessage,
      html: htmlMessage,
    });
  } catch (error) {
    console.error(`[EmailService] Failed to send credentials email to ${email}:`, error);
  }
};

module.exports = {
  sendEmail,
  generateEmailTemplate,
  sendNewSchoolCredentialsEmail,
};
