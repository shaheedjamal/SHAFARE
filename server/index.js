import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { cfg, ROOT, PROD } from './config.js'
import { db } from './db.js'
import { cors, limiter, securityHeaders } from './security.js'
import { authenticate } from './middleware.js'
import { mailMode } from './mail.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import adminRoutes from './routes/admin.js'

const app = express()
app.disable('x-powered-by')
if (cfg.trustProxy) app.set('trust proxy', cfg.trustProxy)
app.use(securityHeaders, cors)
app.use('/api', limiter({ name: 'api', max: 400, windowMs: 60e3 }))
app.use('/api/sync', express.json({ limit: '6mb' }))
app.use('/api/me/avatar', express.json({ limit: '300kb' }))
app.use(express.json({ limit: '50kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.get('/api/config', (_req, res) => res.json({ googleClientId: cfg.googleId, registrationOpen: db.settings.registrationOpen, maintenance: db.settings.maintenanceMode })) // public values only
app.get('/api/content', (_req, res) => res.json({ announcements: db.content.announcements.filter((a) => a.active), featured: db.content.featured, disabledTools: db.content.disabledTools }))

app.use('/api/auth', authRoutes)
app.use('/api/admin', authenticate, adminRoutes)
app.use('/api', authenticate, userRoutes)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }))

const dist = path.join(ROOT, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, setHeaders: (res, f) => res.setHeader('Cache-Control', /[\\/]assets[\\/]/.test(f) ? 'public, max-age=31536000, immutable' : 'no-cache') }))
  app.get('*', (_req, res) => res.setHeader('Cache-Control', 'no-cache').sendFile(path.join(dist, 'index.html')))
}
app.use((err, _req, res, _next) => { if (err.status !== 413 && err.type !== 'entity.parse.failed') console.error(err); res.status(err.status === 413 ? 413 : err.type === 'entity.parse.failed' ? 400 : 500).json({ error: err.status === 413 ? 'That request is too large.' : err.type === 'entity.parse.failed' ? 'Invalid request.' : 'Something went wrong on our side.' }) })
app.listen(cfg.port, () => console.log(`SHAFARE server on http://localhost:${cfg.port}  (mail: ${mailMode}, google: ${cfg.googleId ? 'on' : 'off'}, ${PROD ? 'production' : 'development'})`))
