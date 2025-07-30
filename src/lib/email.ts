// lib/sendEmail.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,           // e.g. smtp.gmail.com or your SMTP provider
  port: Number(process.env.EMAIL_PORT),   // 587 for TLS, 465 for SSL
  secure: true,                          // true for port 465, false for others
  auth: {
    user: process.env.EMAIL_USER,         // your SMTP user/email
    pass: process.env.EMAIL_PASS,         // your SMTP password or app password
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const info = await transporter.sendMail({
    from: `"Glowing Hearts Fundraising - " <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log('Email sent:', info.messageId);
}