import nodemailer from 'nodemailer'
import { cfg } from './config.js'

const smtp = cfg.smtp ? nodemailer.createTransport(cfg.smtp) : null
export const mailMode = smtp ? 'smtp' : 'console'
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export async function sendMail(to, subject, intro, url, cta) {
  const text = `${intro}\n\n${cta}: ${url}\n\nIf you did not request this, you can ignore this email.`
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#0B1018">
    <h2 style="margin:0 0 12px;letter-spacing:.2em">SHAFARE</h2><p>${esc(intro)}</p>
    <p><a href="${esc(url)}" style="display:inline-block;background:#2563EB;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">${esc(cta)}</a></p>
    <p style="color:#71717A;font-size:13px">If you did not request this, you can ignore this email.</p></div>`
  if (!smtp) return console.log(`\n[mail:console] To: ${to}\nSubject: ${subject}\n${text}\n`)
  try { await smtp.sendMail({ from: cfg.mailFrom, to, subject, text, html }) } catch (e) { console.error('mail failed:', e.message) }
}
