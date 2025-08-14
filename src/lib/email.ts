// lib/sendEmail.ts
import nodemailer from 'nodemailer'

function parseBool(v: string | undefined, fallback: boolean) {
  if (v === undefined) return fallback
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
}

const host = process.env.EMAIL_HOST
const port = Number(process.env.EMAIL_PORT || 465)
const secure = parseBool(process.env.EMAIL_SECURE, port === 465) // true for 465, false for 587 by default
const user = process.env.EMAIL_USER
const pass = process.env.EMAIL_PASS

if (!host || !user || !pass) {
  throw new Error('SMTP env vars missing: EMAIL_HOST, EMAIL_USER, EMAIL_PASS')
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
})

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, from, replyTo }: SendEmailOptions) {
  const fromAddr = from || process.env.EMAIL_FROM || process.env.EMAIL_USER!
  const info = await transporter.sendMail({
    from: fromAddr, // e.g. "Glowing Hearts <no-reply@yourdomain.com>"
    to,
    subject,
    html,
    text,
    replyTo,
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log('Email sent:', info.messageId)
  }
}