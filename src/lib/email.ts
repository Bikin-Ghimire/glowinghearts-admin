// src/lib/email.ts
import 'server-only'
import nodemailer, { Transporter } from 'nodemailer'

function parseBool(v: string | undefined, fallback: boolean) {
  if (v === undefined) return fallback
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
}

type SmtpCfg = {
  host?: string
  port?: number
  secure?: boolean
  user?: string
  pass?: string
  from?: string
}

function readSmtpEnv(): SmtpCfg {
  return {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 465),
    secure: parseBool(process.env.EMAIL_SECURE, true),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  }
}

let transporter: Transporter | null = null

function getTransport(): Transporter | null {
  if (transporter) return transporter
  const cfg = readSmtpEnv()
  if (!cfg.host || !cfg.user || !cfg.pass) {
    // Don’t throw: we’ll skip send and log a warning instead.
    return null
  }

  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  })
  return transporter
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export async function sendEmail(opts: SendEmailOptions) {
  const rid = Math.random().toString(36).slice(2, 8)
  const tx = getTransport()
  if (!tx) {
    console.warn(`[email:${rid}] SMTP not configured (EMAIL_HOST/USER/PASS). Skipping email to ${opts.to}.`)
    return { ok: false as const, skipped: true as const, reason: 'missing_smtp_env', rid }
  }

  const fromAddr = opts.from || process.env.EMAIL_FROM || process.env.EMAIL_USER!
  try {
    const info = await tx.sendMail({
      from: fromAddr,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
    })
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email:${rid}] Sent`, info.messageId)
    }
    return { ok: true as const, messageId: info.messageId, rid }
  } catch (err: any) {
    console.error(`[email:${rid}] send failed`, err?.message || err)
    return { ok: false as const, error: err?.message || String(err), rid }
  }
}