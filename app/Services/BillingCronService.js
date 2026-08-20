const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { SchoolSubscription, BillingSetting, School } = require('../Models');

class BillingCronService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
      port: process.env.MAIL_PORT || 2525,
      auth: {
        user: process.env.MAIL_USER || 'user',
        pass: process.env.MAIL_PASS || 'pass'
      }
    });
  }

  async sendReminderEmail(schoolEmail, schoolName, daysLeft) {
    if (!schoolEmail) return;
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: schoolEmail,
      subject: `Subscription Expiring in ${daysLeft} Days - Action Required`,
      text: `Hello ${schoolName},\n\nYour school management subscription is expiring in ${daysLeft} days. Please login to your dashboard to renew and avoid service interruption.\n\nThank you,\nAdmin Team`
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`Failed to send email to ${schoolEmail}:`, error);
    }
  }

  start() {
    // Run everyday at Midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
      console.log('Running Billing Cron Job...');
      try {
        const today = new Date();
        const config = await BillingSetting.findOne();
        const graceDays = config ? config.grace_period_days : 7;

        const subscriptions = await SchoolSubscription.findAll({
          include: [{ model: School, as: 'school' }]
        });

        for (const sub of subscriptions) {
          if (!sub.school) continue;

          const endsAt = new Date(sub.ends_at);
          const diffTime = endsAt.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // 1. Send Reminders (7, 3, 1 days before expiry)
          if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
            await this.sendReminderEmail(sub.school.email, sub.school.school_name, diffDays);
          }

          // 2. Handle Grace Period and Suspension
          if (diffDays < 0) {
            // It has expired
            if (Math.abs(diffDays) > graceDays) {
              // Past grace period -> Suspend
              if (sub.status !== 'cancelled' && sub.status !== 'past_due') {
                sub.status = 'past_due'; // Using past_due since 'suspended' might not be in ENUM
                await sub.save();
                console.log(`Suspended/Past Due subscription for school: ${sub.school_id}`);
              }
            } else {
              // Within grace period
              if (sub.status === 'active') {
                // can set to another status or keep active, let's keep it past_due
                sub.status = 'past_due';
                await sub.save();
                console.log(`Marked past_due subscription for school: ${sub.school_id}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error running billing cron job:', error);
      }
    });
    console.log('Billing Cron Service Initialized.');
  }
}

module.exports = new BillingCronService();
