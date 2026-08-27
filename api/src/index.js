'use strict'
const express    = require('express')
const cors       = require('cors')
const mysql      = require('mysql2/promise')
const jwt        = require('jsonwebtoken')
const cron       = require('node-cron')
const nodemailer = require('nodemailer')

const app = express()
app.set('trust proxy', 1)
app.use(cors())
app.use(express.json())

// ── DB Pool ────────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'leymaken_mysql',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'leymaken',
  password: process.env.DB_PASS || '81)wkJ;3na4+',
  database: process.env.DB_NAME || 'dominicana_tour',
  charset: 'UTF8MB4_UNICODE_CI',
  waitForConnections: true,
  connectionLimit: 10,
})

// ── JWT helpers ────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'dominicantour_admin_secret_2026'

function issueToken() {
  return jwt.sign({ sub: 'admin', v: 1 }, JWT_SECRET, { expiresIn: '24h' })
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return res.status(401).json({ error: 'Unauthorized' })
  try {
    jwt.verify(m[1].trim(), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get(['/health', '/'], (req, res) => {
  res.json({ ok: true, service: 'dominicantour-api', version: '3.0.0' })
})

// ── Admin Login ───────────────────────────────────────────────────────────────
app.post('/admin/login', async (req, res) => {
  const { email = '', password = '' } = req.body || {}
  const expected_email = (process.env.ADMIN_EMAIL || 'salopzmatt+test@gmail.com').toLowerCase()
  const expected_pass = process.env.ADMIN_PASSWORD || 'admin123'
  if (email.trim().toLowerCase() !== expected_email || password !== expected_pass) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  res.json({ ok: true, token: issueToken(), expiresIn: 86400 })
})

// ── Admin Users (me) ──────────────────────────────────────────────────────────
app.get('/v3/admin/users', requireAdmin, (req, res) => {
  const email = process.env.ADMIN_EMAIL || 'salopzmatt+test@gmail.com'
  res.json({ id: 1, email, full_name: 'Admin', role: 'super_admin' })
})

// ── Dashboard Stats ───────────────────────────────────────────────────────────
app.get('/v3/admin/stats', requireAdmin, async (req, res) => {
  const [[tours]] = await pool.query('SELECT COUNT(*) AS c FROM Tour WHERE active = 1')
  const [[reservations]] = await pool.query('SELECT COUNT(*) AS c FROM Reservation')
  const [[pending]] = await pool.query("SELECT COUNT(*) AS c FROM Reservation WHERE status = 'PENDING'")
  const [[revenue]] = await pool.query(
    "SELECT COALESCE(SUM(totalAmount),0) AS c FROM Reservation WHERE MONTH(createdAt)=MONTH(NOW()) AND YEAR(createdAt)=YEAR(NOW()) AND status != 'CANCELLED'"
  )
  const [[upcoming]] = await pool.query(`
    SELECT COUNT(*) AS c FROM Reservation r
    JOIN TourDate d ON d.id = r.tourDateId
    WHERE d.date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    AND r.status IN ('PENDING','CONFIRMED')
  `)
  const [recent] = await pool.query(`
    SELECT r.id, r.code, r.status, r.firstName, r.lastName, r.email,
           r.adults, r.children, r.totalAmount, r.paidDeposit, r.createdAt,
           t.name AS tour_name, d.date AS tour_date
    FROM Reservation r
    JOIN Tour t ON t.id = r.tourId
    JOIN TourDate d ON d.id = r.tourDateId
    ORDER BY r.createdAt DESC LIMIT 5
  `)
  // Last 6 months revenue
  const [monthly] = await pool.query(`
    SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month,
           COALESCE(SUM(totalAmount), 0) AS revenue
    FROM Reservation
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    AND status != 'CANCELLED'
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month
  `)
  // Tours with dates this week nearly full (>80%)
  const [alerts] = await pool.query(`
    SELECT t.name AS tour, DATE_FORMAT(d.date,'%Y-%m-%d') AS date,
           ROUND(d.bookedSpots / d.availableSpots * 100) AS pct
    FROM TourDate d
    JOIN Tour t ON t.id = d.tourId
    WHERE d.date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    AND d.availableSpots > 0
    AND (d.bookedSpots / d.availableSpots) >= 0.80
    ORDER BY d.date
  `)
  res.json({
    tours: tours.c, reservations: reservations.c,
    pending: pending.c, revenue: Number(revenue.c),
    upcomingCount: upcoming.c,
    recentReservations: recent,
    monthlyRevenue: monthly.map(r => ({ month: r.month, revenue: Number(r.revenue) })),
    occupancyAlerts: alerts,
  })
})

// ── Operaciones del día ───────────────────────────────────────────────────────
app.get('/v3/admin/operaciones', requireAdmin, async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10)
  const [dates] = await pool.query(`
    SELECT d.id AS dateId, d.date, d.availableSpots, d.bookedSpots,
           t.id AS tourId, t.name AS tourName, t.departureTime, t.meetingPoint,
           c.name AS categoryName
    FROM TourDate d
    JOIN Tour t ON t.id = d.tourId
    LEFT JOIN Category c ON c.id = t.categoryId
    WHERE DATE(d.date) = ?
    AND t.active = 1
    ORDER BY t.name
  `, [date])

  const result = []
  for (const d of dates) {
    const [reservations] = await pool.query(`
      SELECT r.id, r.code, r.status, r.firstName, r.lastName, r.email, r.phone,
             r.hotel, r.hotelZone, r.language, r.adults, r.children,
             r.paidDeposit, r.internalNotes,
             u.name AS guideName
      FROM Reservation r
      LEFT JOIN User u ON u.id = r.guideId
      WHERE r.tourDateId = ?
      AND r.status IN ('PENDING','CONFIRMED')
      ORDER BY r.hotelZone, r.hotel
    `, [d.dateId])
    result.push({ ...d, reservations })
  }
  res.json({ date, tours: result })
})

// ── Tours ─────────────────────────────────────────────────────────────────────
app.get('/v3/admin/tours', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT t.id, t.slug, t.name, t.subtitle, t.priceAdult, t.priceChild, t.duration,
           t.difficulty, t.maxPeople, t.minPeople, t.meetingPoint, t.active, t.featured,
           t.departureZone, t.departureTime,
           c.name AS category_name,
           (SELECT COUNT(*) FROM Reservation r WHERE r.tourId = t.id) AS reservations_count,
           (SELECT url FROM TourImage ti WHERE ti.tourId = t.id ORDER BY ti.order LIMIT 1) AS cover_image
    FROM Tour t
    LEFT JOIN Category c ON c.id = t.categoryId
    ORDER BY t.name
  `)
  res.json(rows)
})

app.get('/v3/admin/tours/:id', requireAdmin, async (req, res) => {
  const [tours] = await pool.query(`
    SELECT t.*, c.name AS category_name FROM Tour t
    LEFT JOIN Category c ON c.id = t.categoryId WHERE t.id = ?
  `, [req.params.id])
  if (!tours.length) return res.status(404).json({ error: 'Not found' })
  const [images]    = await pool.query('SELECT * FROM TourImage WHERE tourId=? ORDER BY `order`', [req.params.id])
  const [dates]     = await pool.query('SELECT * FROM TourDate WHERE tourId=? ORDER BY date', [req.params.id])
  const [itinerary] = await pool.query('SELECT * FROM ItineraryItem WHERE tourId=? ORDER BY `order`', [req.params.id])
  const [includes]  = await pool.query('SELECT * FROM TourInclude WHERE tourId=?', [req.params.id])
  res.json({ ...tours[0], images, dates, itinerary, includes })
})

app.post('/v3/admin/tours', requireAdmin, async (req, res) => {
  const {
    slug, name, subtitle = '', description = '', priceAdult, priceChild = 0,
    duration = '', difficulty = 'EASY', categoryId, maxPeople = 20, minPeople = 1,
    minAge = 0, departureZone = '', departureTime = '', meetingPoint = '',
    languages = 'Español', active = true, featured = false,
  } = req.body
  const [r] = await pool.query(
    `INSERT INTO Tour (slug,name,subtitle,description,priceAdult,priceChild,duration,
      difficulty,categoryId,maxPeople,minPeople,minAge,departureZone,departureTime,
      meetingPoint,languages,active,featured,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
    [slug, name, subtitle, description, priceAdult, priceChild, duration,
     difficulty, categoryId, maxPeople, minPeople, minAge, departureZone, departureTime,
     meetingPoint, languages, active ? 1 : 0, featured ? 1 : 0]
  )
  syncDestinations()
  res.json({ ok: true, id: r.insertId })
})

app.put('/v3/admin/tours/:id', requireAdmin, async (req, res) => {
  const {
    name, subtitle, description, priceAdult, priceChild, duration,
    difficulty, categoryId, maxPeople, minPeople, minAge, departureZone,
    departureTime, meetingPoint, languages, active, featured,
  } = req.body
  await pool.query(
    `UPDATE Tour SET name=?,subtitle=?,description=?,priceAdult=?,priceChild=?,
      duration=?,difficulty=?,categoryId=?,maxPeople=?,minPeople=?,minAge=?,
      departureZone=?,departureTime=?,meetingPoint=?,languages=?,active=?,featured=?,updatedAt=NOW()
     WHERE id=?`,
    [name, subtitle, description, priceAdult, priceChild, duration, difficulty,
     categoryId, maxPeople, minPeople ?? 1, minAge, departureZone, departureTime,
     meetingPoint, languages, active ? 1 : 0, featured ? 1 : 0, req.params.id]
  )
  syncDestinations()
  res.json({ ok: true })
})

app.delete('/v3/admin/tours/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM Tour WHERE id=?', [req.params.id])
  syncDestinations()
  res.json({ ok: true })
})

app.patch('/v3/admin/tours/:id/toggle-active', requireAdmin, async (req, res) => {
  await pool.query('UPDATE Tour SET active=NOT active, updatedAt=NOW() WHERE id=?', [req.params.id])
  syncDestinations()
  res.json({ ok: true })
})

app.patch('/v3/admin/tours/:id/toggle-featured', requireAdmin, async (req, res) => {
  await pool.query('UPDATE Tour SET featured=NOT featured, updatedAt=NOW() WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

app.post('/v3/admin/tours/:id/dates', requireAdmin, async (req, res) => {
  const { date, availableSpots = 20 } = req.body
  const [r] = await pool.query(
    'INSERT INTO TourDate (tourId,date,availableSpots,bookedSpots,status) VALUES (?,?,?,0,"OPEN")',
    [req.params.id, date, availableSpots]
  )
  res.json({ ok: true, id: r.insertId })
})

app.delete('/v3/admin/tours/:id/dates/:dateId', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM TourDate WHERE id=? AND tourId=?', [req.params.dateId, req.params.id])
  res.json({ ok: true })
})

// ── Reservations ──────────────────────────────────────────────────────────────
app.get('/v3/admin/reservations', requireAdmin, async (req, res) => {
  const { status, q, tour_id, date_from, date_to, limit = 50, offset = 0 } = req.query
  const conditions = ['1=1']
  const params = []
  if (status && status !== 'ALL') { conditions.push('r.status=?'); params.push(status) }
  if (q) { conditions.push('(r.firstName LIKE ? OR r.lastName LIKE ? OR r.code LIKE ? OR r.phone LIKE ?)'); const qv = `%${q}%`; params.push(qv,qv,qv,qv) }
  if (tour_id) { conditions.push('r.tourId=?'); params.push(tour_id) }
  if (date_from) { conditions.push('d.date >= ?'); params.push(date_from) }
  if (date_to)   { conditions.push('d.date <= ?'); params.push(date_to) }
  const where = conditions.join(' AND ')
  const baseFrom = 'FROM Reservation r JOIN Tour t ON t.id=r.tourId JOIN TourDate d ON d.id=r.tourDateId'
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${baseFrom} WHERE ${where}`, params)
  const [rows] = await pool.query(`
    SELECT r.id, r.code, r.status, r.firstName, r.lastName, r.email, r.phone,
           r.country, r.hotel, r.hotelZone, r.language, r.adults, r.children,
           r.totalAmount, r.depositAmount, r.paymentMethod, r.paidDeposit,
           r.notes, r.internalNotes, r.createdAt,
           t.name AS tour_name, t.slug AS tour_slug, d.date AS tour_date
    ${baseFrom} WHERE ${where}
    ORDER BY r.createdAt DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), Number(offset)])
  res.json({ total: Number(total), rows, limit: Number(limit), offset: Number(offset) })
})

app.get('/v3/admin/reservations/:id', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT r.*, t.name AS tour_name, t.slug AS tour_slug, d.date AS tour_date
    FROM Reservation r JOIN Tour t ON t.id=r.tourId JOIN TourDate d ON d.id=r.tourDateId
    WHERE r.id=?
  `, [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Not found' })
  const [participants] = await pool.query('SELECT * FROM Participant WHERE reservationId=?', [req.params.id])
  res.json({ ...rows[0], participants })
})

app.patch('/v3/admin/reservations/:id', requireAdmin, async (req, res) => {
  const allowed = ['status', 'paidDeposit', 'internalNotes', 'guideId']
  const updates = [], values = []
  for (const key of allowed) {
    if (req.body[key] !== undefined) { updates.push(`\`${key}\`=?`); values.push(req.body[key]) }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' })
  updates.push('updatedAt=NOW()')
  values.push(req.params.id)
  await pool.query(`UPDATE Reservation SET ${updates.join(',')} WHERE id=?`, values)
  const [rows] = await pool.query('SELECT * FROM Reservation WHERE id=?', [req.params.id])
  res.json({ ok: true, reserva: rows[0] })
})

// ── Categories ────────────────────────────────────────────────────────────────
app.get('/v3/admin/categories', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.*, (SELECT COUNT(*) FROM Tour t WHERE t.categoryId=c.id) AS tours_count
    FROM Category c ORDER BY c.name
  `)
  res.json({ categories: rows })
})

app.post('/v3/admin/categories', requireAdmin, async (req, res) => {
  const { name, slug, icon = '', cover_image } = req.body
  const [r] = await pool.query('INSERT INTO Category (name,slug,icon,cover_image) VALUES (?,?,?,?)', [name, slug, icon, cover_image ?? null])
  res.json({ ok: true, id: r.insertId })
})

app.put('/v3/admin/categories/:id', requireAdmin, async (req, res) => {
  const { name, slug, icon, cover_image } = req.body
  await pool.query('UPDATE Category SET name=?,slug=?,icon=?,cover_image=? WHERE id=?', [name, slug, icon, cover_image ?? null, req.params.id])
  res.json({ ok: true })
})

app.delete('/v3/admin/categories/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM Category WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ── Coupons ───────────────────────────────────────────────────────────────────
app.get('/v3/admin/coupons', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM coupons ORDER BY createdAt DESC')
  res.json(rows)
})

app.post('/v3/admin/coupons', requireAdmin, async (req, res) => {
  const { code, description = '', discountType, discountValue, minAmount, maxUses, expiresAt, active = true } = req.body
  const [r] = await pool.query(
    `INSERT INTO coupons (code,description,discountType,discountValue,minAmount,maxUses,usedCount,expiresAt,active,createdAt)
     VALUES (?,?,?,?,?,?,0,?,?,NOW())`,
    [code.toUpperCase(), description, discountType, discountValue, minAmount || null, maxUses || null, expiresAt || null, active ? 1 : 0]
  )
  res.json({ ok: true, id: r.insertId })
})

app.put('/v3/admin/coupons/:id', requireAdmin, async (req, res) => {
  const { code, description, discountType, discountValue, minAmount, maxUses, expiresAt, active } = req.body
  await pool.query(
    'UPDATE coupons SET code=?,description=?,discountType=?,discountValue=?,minAmount=?,maxUses=?,expiresAt=?,active=? WHERE id=?',
    [code.toUpperCase(), description, discountType, discountValue, minAmount || null, maxUses || null, expiresAt || null, active ? 1 : 0, req.params.id]
  )
  res.json({ ok: true })
})

app.patch('/v3/admin/coupons/:id/toggle', requireAdmin, async (req, res) => {
  await pool.query('UPDATE coupons SET active=NOT active WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

app.delete('/v3/admin/coupons/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM coupons WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ── Reviews ───────────────────────────────────────────────────────────────────
app.get('/v3/admin/reviews', requireAdmin, async (req, res) => {
  const { tourId, approved } = req.query
  let query = `
    SELECT rv.*, t.name AS tour_name
    FROM Review rv LEFT JOIN Tour t ON t.id=rv.tourId
    WHERE 1=1
  `
  const params = []
  if (tourId) { query += ' AND rv.tourId=?'; params.push(tourId) }
  if (approved !== undefined) { query += ' AND rv.approved=?'; params.push(approved === '1' ? 1 : 0) }
  query += ' ORDER BY rv.createdAt DESC'
  const [rows] = await pool.query(query, params)

  // Average per tour
  const [averages] = await pool.query(`
    SELECT tourId, t.name AS tour_name,
           ROUND(AVG(rating),1) AS avg_rating, COUNT(*) AS total
    FROM Review rv JOIN Tour t ON t.id=rv.tourId
    WHERE rv.approved=1
    GROUP BY tourId ORDER BY avg_rating DESC
  `)
  res.json({ reviews: rows, averages })
})

app.post('/v3/admin/reviews', requireAdmin, async (req, res) => {
  const { tourId, reservationId, firstName, country, rating, comment, language = 'es' } = req.body
  const [r] = await pool.query(
    'INSERT INTO Review (tourId,reservationId,firstName,country,rating,comment,language,approved,createdAt) VALUES (?,?,?,?,?,?,?,0,NOW())',
    [tourId || null, reservationId || null, firstName, country, rating, comment, language]
  )
  res.json({ ok: true, id: r.insertId })
})

app.patch('/v3/admin/reviews/:id/approve', requireAdmin, async (req, res) => {
  await pool.query('UPDATE Review SET approved=1 WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

app.patch('/v3/admin/reviews/:id/reject', requireAdmin, async (req, res) => {
  await pool.query('UPDATE Review SET approved=0 WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

app.delete('/v3/admin/reviews/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM Review WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ── Settings (site_configs table) ────────────────────────────────────────────
app.get('/v3/admin/settings', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT `key`, `value` FROM site_configs')
  const settings = {}
  for (const r of rows) settings[r.key] = r.value
  res.json(settings)
})

app.patch('/v3/admin/settings', requireAdmin, async (req, res) => {
  const entries = Object.entries(req.body || {})
  if (!entries.length) return res.status(400).json({ error: 'Nothing to update' })
  for (const [key, value] of entries) {
    await pool.query(
      'INSERT INTO site_configs (`key`, `value`, updatedAt) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`), updatedAt=NOW()',
      [key, String(value)]
    )
  }
  const [rows] = await pool.query('SELECT `key`, `value` FROM site_configs')
  const settings = {}
  for (const r of rows) settings[r.key] = r.value
  res.json({ ok: true, settings })
})

// ── Public Catalog ────────────────────────────────────────────────────────────
app.get('/catalog', async (req, res) => {
  const [products] = await pool.query(`
    SELECT t.id, t.slug, t.name, t.subtitle,
           t.priceAdult AS price_adult, t.priceChild AS price_child,
           t.duration, t.difficulty, t.featured,
           t.departureZone AS departure_zone, t.departureTime AS departure_time,
           (SELECT ti.url FROM TourImage ti WHERE ti.tourId=t.id ORDER BY ti.\`order\` LIMIT 1) AS cover_image,
           c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug, c.icon AS cat_icon
    FROM Tour t
    LEFT JOIN Category c ON c.id=t.categoryId
    WHERE t.active=1
    ORDER BY t.featured DESC, t.name
  `)
  const [catRows] = await pool.query('SELECT id, name, slug, icon, cover_image FROM Category ORDER BY name')
  const formatted = products.map(t => ({
    id: t.id, slug: t.slug, name: t.name, subtitle: t.subtitle,
    price_adult: t.price_adult, price_child: t.price_child,
    duration: t.duration, difficulty: t.difficulty, featured: !!t.featured,
    departure_zone: t.departure_zone, departure_time: t.departure_time,
    lat: null, lng: null, cover_image: t.cover_image,
    category: { id: t.cat_id, name: t.cat_name, slug: t.cat_slug, icon: t.cat_icon, color: '' },
  }))
  res.json({ data: { products: formatted, categories: catRows.map(c => ({ ...c, color: '' })) } })
})

app.get('/catalog/:slug', async (req, res) => {
  const [tours] = await pool.query(`
    SELECT t.id, t.slug, t.name, t.subtitle, t.description,
           t.priceAdult AS price_adult, t.priceChild AS price_child,
           t.duration, t.difficulty, t.featured, t.maxPeople AS max_people,
           t.minAge AS min_age, t.departureZone AS departure_zone,
           t.departureTime AS departure_time, t.languages,
           c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug, c.icon AS cat_icon
    FROM Tour t
    LEFT JOIN Category c ON c.id=t.categoryId
    WHERE t.slug=? AND t.active=1
  `, [req.params.slug])
  if (!tours.length) return res.status(404).json({ error: 'Not found' })
  const t = tours[0]
  const [images]    = await pool.query('SELECT url, alt FROM TourImage WHERE tourId=? ORDER BY `order`', [t.id])
  const [itinerary] = await pool.query('SELECT id, time, title, description, `order` FROM ItineraryItem WHERE tourId=? ORDER BY `order`', [t.id])
  const [includes]  = await pool.query('SELECT id, text, included FROM TourInclude WHERE tourId=?', [t.id])
  res.json({ data: {
    id: t.id, slug: t.slug, name: t.name, subtitle: t.subtitle, description: t.description,
    price_adult: t.price_adult, price_child: t.price_child,
    duration: t.duration, difficulty: t.difficulty, featured: !!t.featured,
    max_people: t.max_people, min_age: t.min_age,
    departure_zone: t.departure_zone, departure_time: t.departure_time,
    languages: t.languages, lat: null, lng: null,
    category: { id: t.cat_id, name: t.cat_name, slug: t.cat_slug, icon: t.cat_icon, color: '' },
    images: images.map(i => ({ url: i.url, alt: i.alt })),
    itinerary: itinerary.map(i => ({ id: i.id, time: i.time, title: i.title, description: i.description, order: i.order })),
    includes: includes.map(i => ({ id: i.id, text: i.text, included: !!i.included })),
  }})
})

// ── Public Availability ───────────────────────────────────────────────────────
app.get('/availability/:id', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT id, DATE_FORMAT(date,'%Y-%m-%d') AS date,
           availableSpots AS max_spots, (availableSpots - bookedSpots) AS spots_left
    FROM TourDate
    WHERE tourId=? AND date >= CURDATE() AND status='OPEN'
    AND (availableSpots - bookedSpots) > 0
    ORDER BY date LIMIT 90
  `, [req.params.id])
  res.json({ data: rows })
})

// ── Public Bookings ───────────────────────────────────────────────────────────
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = 'DT'
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

app.post('/bookings', async (req, res) => {
  const {
    product_id, availability_id, date,
    first_name, last_name, email, phone,
    hotel = '', adults = 1, children = 0,
    payment_method = 'whatsapp', notes = null,
  } = req.body || {}

  if (!product_id || !first_name || !phone || !adults)
    return res.status(400).json({ error: 'Faltan campos requeridos' })

  const [tours] = await pool.query('SELECT id, priceAdult, priceChild FROM Tour WHERE id=? AND active=1', [product_id])
  if (!tours.length) return res.status(404).json({ error: 'Tour no encontrado' })
  const tour = tours[0]

  let tourDateId = availability_id ? Number(availability_id) : null

  if (tourDateId) {
    const [slots] = await pool.query('SELECT id, availableSpots, bookedSpots FROM TourDate WHERE id=? AND tourId=?', [tourDateId, product_id])
    if (!slots.length) return res.status(404).json({ error: 'Fecha no disponible' })
    if (slots[0].bookedSpots >= slots[0].availableSpots)
      return res.status(400).json({ error: 'No hay cupos disponibles para esta fecha' })
  } else {
    const useDate = date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const [r] = await pool.query(
      "INSERT INTO TourDate (tourId, date, availableSpots, bookedSpots, status) VALUES (?, ?, 999, 0, 'OPEN')",
      [product_id, useDate]
    )
    tourDateId = r.insertId
  }

  const totalAmount = Number(tour.priceAdult) * Number(adults) + Number(tour.priceChild) * Number(children)
  const depositAmount = Math.ceil(totalAmount * 0.2 * 100) / 100
  const code = genCode()

  await pool.query(`
    INSERT INTO Reservation
      (code, tourId, tourDateId, status, firstName, lastName, email, phone,
       country, hotel, hotelZone, language, adults, children,
       totalAmount, depositAmount, paymentMethod, paidDeposit, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, '', ?, '', 'es', ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())
  `, [code, product_id, tourDateId,
      first_name, last_name || '', email || '', phone,
      hotel, adults, children,
      totalAmount, depositAmount,
      payment_method || 'whatsapp',
      notes || null])

  await pool.query('UPDATE TourDate SET bookedSpots = bookedSpots + ? WHERE id=?', [Number(adults) + Number(children), tourDateId])

  res.json({ data: { code, status: 'PENDING' } })
})

app.get('/bookings/:code', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT r.code, r.status, r.firstName AS first_name, r.lastName AS last_name,
           r.adults, r.children,
           r.totalAmount AS total_amount, r.depositAmount AS deposit_amount,
           r.paymentMethod AS payment_method, r.createdAt AS created_at,
           t.name AS tour_name, t.slug AS tour_slug,
           DATE_FORMAT(d.date,'%Y-%m-%d') AS availability_date
    FROM Reservation r
    JOIN Tour t ON t.id=r.tourId
    JOIN TourDate d ON d.id=r.tourDateId
    WHERE r.code=?
  `, [req.params.code.toUpperCase()])
  if (!rows.length) return res.status(404).json({ error: 'Not found' })
  const b = rows[0]
  const [cfg] = await pool.query("SELECT value FROM site_configs WHERE `key`='whatsapp'")
  const waNumber = cfg.length ? cfg[0].value : '18095550100'
  res.json({ data: {
    code: b.code, status: b.status,
    first_name: b.first_name, last_name: b.last_name || null,
    adults: b.adults, children: b.children,
    total_amount: Number(b.total_amount), deposit_amount: Number(b.deposit_amount),
    payment_method: b.payment_method,
    product: { name: b.tour_name, slug: b.tour_slug },
    availability: { date: b.availability_date },
    site: { wa_number: waNumber },
    created_at: b.created_at,
  }})
})

// ── Destination auto-sync ─────────────────────────────────────────────────────
// Runs after any tour/accommodation mutation (fire & forget)
async function syncDestinations() {
  try {
    const [dests] = await pool.query('SELECT id, name FROM destinations')
    for (const dest of dests) {
      const [[{ cnt }]] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM Tour WHERE departureZone = ? AND active = 1',
        [dest.name]
      )
      await pool.query('UPDATE destinations SET active = ? WHERE id = ?', [cnt > 0 ? 1 : 0, dest.id])
    }
    // Featured: top 5 destinations by most recent tour createdAt
    await pool.query('UPDATE destinations SET featured = 0')
    const [ranked] = await pool.query(`
      SELECT d.id, MAX(t.createdAt) AS lastActivity
      FROM destinations d
      JOIN Tour t ON t.departureZone = d.name
      WHERE d.active = 1
      GROUP BY d.id
      ORDER BY lastActivity DESC
      LIMIT 5
    `)
    if (ranked.length > 0) {
      const ids = ranked.map(r => r.id)
      await pool.query(`UPDATE destinations SET featured = 1 WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
    }
  } catch (e) {
    console.error('syncDestinations error:', e.message)
  }
}

// ── File Upload ───────────────────────────────────────────────────────────────
const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads'
fs.mkdirSync(UPLOAD_DIR, { recursive: true })
app.use('/uploads', require('express').static(UPLOAD_DIR))

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename:    (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } })

app.post('/v3/admin/upload', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const url = `${req.protocol}://${req.get('host')}/api/uploads/${req.file.filename}`
  res.json({ ok: true, url })
})

// ── Invoices ──────────────────────────────────────────────────────────────────
app.get('/v3/admin/invoices', requireAdmin, async (req, res) => {
  const { status, q, limit = 50, offset = 0 } = req.query
  let where = '1=1'
  const params = []
  if (status && status !== 'ALL') { where += ' AND i.status = ?'; params.push(status) }
  if (q) {
    where += ' AND (i.number LIKE ? OR r.firstName LIKE ? OR r.lastName LIKE ? OR i.number LIKE ?)'
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
  }
  const countSql = `SELECT COUNT(*) AS c FROM Invoice i JOIN Reservation r ON r.id=i.reservationId WHERE ${where}`
  const [[{ c: total }]] = await pool.query(countSql, params)
  const rows = await pool.query(`
    SELECT i.id, i.number, i.status, i.subtotal, i.discount, i.total, i.currency,
           i.notes, i.paid_at, i.createdAt,
           r.id AS reservation_id, r.code AS reservation_code,
           r.firstName, r.lastName, r.email, r.phone,
           r.adults, r.children, r.paymentMethod,
           t.name AS tour_name,
           DATE_FORMAT(d.date,'%Y-%m-%d') AS tour_date
    FROM Invoice i
    JOIN Reservation r ON r.id = i.reservationId
    LEFT JOIN Tour t ON t.id = r.tourId
    LEFT JOIN TourDate d ON d.id = r.tourDateId
    WHERE ${where}
    ORDER BY i.createdAt DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), Number(offset)])
  res.json({ total, rows: rows[0], limit: Number(limit), offset: Number(offset) })
})

app.get('/v3/admin/invoices/:id', requireAdmin, async (req, res) => {
  const [[row]] = await pool.query(`
    SELECT i.*, r.code AS reservation_code, r.firstName, r.lastName, r.email, r.phone,
           r.adults, r.children, r.paymentMethod,
           t.name AS tour_name, DATE_FORMAT(d.date,'%Y-%m-%d') AS tour_date
    FROM Invoice i
    JOIN Reservation r ON r.id = i.reservationId
    LEFT JOIN Tour t ON t.id = r.tourId
    LEFT JOIN TourDate d ON d.id = r.tourDateId
    WHERE i.id = ?
  `, [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(row)
})

app.patch('/v3/admin/invoices/:id', requireAdmin, async (req, res) => {
  const { status, notes } = req.body
  const updates = []
  const params = []
  if (status) { updates.push('status=?'); params.push(status) }
  if (status === 'PAID') { updates.push('paid_at=NOW()') }
  if (notes !== undefined) { updates.push('notes=?'); params.push(notes) }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' })
  params.push(req.params.id)
  await pool.query(`UPDATE Invoice SET ${updates.join(',')} WHERE id=?`, params)
  const [[row]] = await pool.query('SELECT * FROM Invoice WHERE id=?', [req.params.id])
  res.json(row)
})

// ── Reports ───────────────────────────────────────────────────────────────────
app.get('/v3/admin/reports', requireAdmin, async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear()
  const [[totals]] = await pool.query(`
    SELECT COALESCE(SUM(i.total),0) AS totalRevenue, COUNT(*) AS totalReservations
    FROM Reservation r
    JOIN Invoice i ON i.reservationId=r.id
    WHERE YEAR(r.createdAt)=? AND r.status != 'CANCELLED'
  `, [year])
  const avg = totals.totalReservations > 0
    ? Number(totals.totalRevenue) / Number(totals.totalReservations)
    : 0
  const [byMonthRows] = await pool.query(`
    SELECT DATE_FORMAT(r.createdAt,'%b') AS month,
           MONTH(r.createdAt) AS monthNum,
           COALESCE(SUM(i.total),0) AS revenue,
           COUNT(*) AS reservations
    FROM Reservation r
    JOIN Invoice i ON i.reservationId=r.id
    WHERE YEAR(r.createdAt)=? AND r.status != 'CANCELLED'
    GROUP BY monthNum, month
    ORDER BY monthNum
  `, [year])
  const [byStatusRows] = await pool.query(`
    SELECT status, COUNT(*) AS cnt FROM Reservation WHERE YEAR(createdAt)=? GROUP BY status
  `, [year])
  const [byPaymentRows] = await pool.query(`
    SELECT paymentMethod, COUNT(*) AS cnt FROM Reservation WHERE YEAR(createdAt)=? AND paymentMethod IS NOT NULL GROUP BY paymentMethod
  `, [year])
  const [topToursRows] = await pool.query(`
    SELECT r.tourId, t.name AS tour_name, COALESCE(SUM(i.total),0) AS revenue, COUNT(*) AS cnt
    FROM Reservation r
    JOIN Invoice i ON i.reservationId=r.id
    JOIN Tour t ON t.id=r.tourId
    WHERE YEAR(r.createdAt)=? AND r.status != 'CANCELLED'
    GROUP BY r.tourId, t.name
    ORDER BY revenue DESC
    LIMIT 10
  `, [year])
  const byStatus = {}
  for (const r of byStatusRows) byStatus[r.status] = Number(r.cnt)
  const byPaymentMethod = {}
  for (const r of byPaymentRows) byPaymentMethod[r.paymentMethod] = Number(r.cnt)
  res.json({
    totalRevenue: Number(totals.totalRevenue),
    totalReservations: Number(totals.totalReservations),
    avgPerReservation: avg,
    byMonth: byMonthRows.map(m => ({ month: m.month, revenue: Number(m.revenue), reservations: Number(m.reservations) })),
    byStatus,
    byPaymentMethod,
    topTours: topToursRows.map(t => ({ tourId: t.tourId, tour_name: t.tour_name, revenue: Number(t.revenue), count: Number(t.cnt) })),
  })
})

// ── Offers ────────────────────────────────────────────────────────────────────
app.get('/v3/admin/offers', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT o.*, t.name AS tour_name
    FROM tour_offers o
    LEFT JOIN Tour t ON t.id=o.tourId
    ORDER BY o.createdAt DESC
  `)
  res.json(rows.map(r => ({ ...r, active: !!r.active })))
})

app.post('/v3/admin/offers', requireAdmin, async (req, res) => {
  const { tourId, label, discountPercent, startsAt, endsAt, active = true } = req.body
  if (!tourId || !label || !discountPercent || !startsAt || !endsAt)
    return res.status(400).json({ error: 'Missing required fields' })
  const [result] = await pool.query(
    'INSERT INTO tour_offers (tourId, label, discountPercent, startsAt, endsAt, active) VALUES (?,?,?,?,?,?)',
    [tourId, label, discountPercent, startsAt, endsAt, active ? 1 : 0]
  )
  const [[row]] = await pool.query('SELECT * FROM tour_offers WHERE id=?', [result.insertId])
  res.status(201).json({ ...row, active: !!row.active })
})

app.put('/v3/admin/offers/:id', requireAdmin, async (req, res) => {
  const { tourId, label, discountPercent, startsAt, endsAt, active } = req.body
  await pool.query(
    'UPDATE tour_offers SET tourId=?,label=?,discountPercent=?,startsAt=?,endsAt=?,active=? WHERE id=?',
    [tourId, label, discountPercent, startsAt, endsAt, active ? 1 : 0, req.params.id]
  )
  const [[row]] = await pool.query('SELECT * FROM tour_offers WHERE id=?', [req.params.id])
  res.json({ ...row, active: !!row.active })
})

app.patch('/v3/admin/offers/:id/toggle', requireAdmin, async (req, res) => {
  await pool.query('UPDATE tour_offers SET active = NOT active WHERE id=?', [req.params.id])
  const [[row]] = await pool.query('SELECT * FROM tour_offers WHERE id=?', [req.params.id])
  res.json({ ...row, active: !!row.active })
})

app.delete('/v3/admin/offers/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM tour_offers WHERE id=?', [req.params.id])
  res.json({ ok: true })
})


// ── Public destinations endpoint ──────────────────────────────────────────────
app.get("/destinations", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.id, d.name, d.slug, d.cover_image, d.description, d.region, d.featured,
        (SELECT COUNT(*) FROM Tour t WHERE t.departureZone = d.name AND t.active = 1) AS tours_count
      FROM destinations d
      WHERE d.active = 1
      ORDER BY d.featured DESC, tours_count DESC
    `)
    res.json({ ok: true, destinations: rows.map(r => ({ ...r, featured: !!r.featured, tours_count: Number(r.tours_count) })) })
  } catch (err) {
    console.error("GET /destinations error:", err.message)
    res.status(500).json({ ok: false, error: "DB error" })
  }
})


// ── Public destinations/:slug endpoint ───────────────────────────────────────
app.get("/destinations/:slug", async (req, res) => {
  try {
    const [[dest]] = await pool.query(
      "SELECT id, name, slug, region, cover_image, description, featured FROM destinations WHERE slug = ? AND active = 1",
      [req.params.slug]
    )
    if (!dest) return res.status(404).json({ ok: false, error: "Not found" })

    const [[{ tours_count }]] = await pool.query(
      "SELECT COUNT(*) AS tours_count FROM Tour WHERE departureZone = ? AND active = 1",
      [dest.name]
    )
    dest.tours_count = Number(tours_count)

    const [tourRows] = await pool.query(`
      SELECT t.id, t.slug, t.name, t.subtitle,
             t.priceAdult AS price_adult, t.duration, t.difficulty,
             t.featured, t.coming_soon,
             (SELECT ti.url FROM TourImage ti WHERE ti.tourId = t.id ORDER BY ti.\`order\` LIMIT 1) AS cover_image,
             c.name AS cat_name, c.icon AS cat_icon,
             (SELECT ROUND(AVG(r.rating),1) FROM Review r WHERE r.tourId = t.id) AS avg_rating,
             (SELECT COUNT(*) FROM Review r WHERE r.tourId = t.id) AS review_count
      FROM Tour t
      LEFT JOIN Category c ON c.id = t.categoryId
      WHERE t.departureZone = ? AND t.active = 1
      ORDER BY t.featured DESC, t.name
    `, [dest.name])

    const tours = tourRows.map(t => ({
      id: t.id, slug: t.slug, name: t.name, subtitle: t.subtitle || null,
      price_adult: t.price_adult, duration: t.duration || null,
      difficulty: t.difficulty, featured: !!t.featured, coming_soon: !!t.coming_soon,
      cover_image: t.cover_image || null,
      category: { name: t.cat_name || "", icon: t.cat_icon || null },
      avg_rating: t.avg_rating ? Number(t.avg_rating) : null,
      review_count: Number(t.review_count),
    }))

    let accommodations = []
    if (dest.region) {
      const [accRows] = await pool.query(
        "SELECT id, slug, name, type, stars, price_min, cover_image, short_description FROM accommodations WHERE province = ? AND active = 1 ORDER BY featured DESC, name",
        [dest.region]
      )
      accommodations = accRows
    }

    res.json({ ok: true, destination: { ...dest, featured: !!dest.featured }, tours, accommodations })
  } catch (err) {
    console.error("GET /destinations/:slug error:", err.message)
    res.status(500).json({ ok: false, error: "DB error" })
  }
})

// ── Destinations ──────────────────────────────────────────────────────────────
app.post('/v3/admin/destinations/sync', requireAdmin, async (req, res) => {
  await syncDestinations()
  res.json({ ok: true })
})

app.get('/v3/admin/destinations', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT d.*,
      d2.name AS parent_name,
      (SELECT COUNT(*) FROM Tour t WHERE t.departureZone = d.name AND t.active = 1) AS tours_count,
      (SELECT COUNT(*) FROM accommodations a WHERE a.active = 1 AND a.province = d.region) AS accommodations_count
    FROM destinations d
    LEFT JOIN destinations d2 ON d2.id = d.parent_id
    ORDER BY ISNULL(d.parent_id), d.name
  `)
  res.json(rows.map(r => ({ ...r, featured: !!r.featured, active: !!r.active })))
})

app.post('/v3/admin/destinations', requireAdmin, async (req, res) => {
  const { name, slug, region = null, cover_image = null, description = null, featured = false, active = true, parent_id = null } = req.body
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' })
  const [result] = await pool.query(
    'INSERT INTO destinations (name, slug, region, cover_image, description, featured, active, parent_id) VALUES (?,?,?,?,?,?,?,?)',
    [name, slug, region, cover_image, description, featured ? 1 : 0, active ? 1 : 0, parent_id || null]
  )
  const [[row]] = await pool.query('SELECT * FROM destinations WHERE id=?', [result.insertId])
  res.status(201).json({ ...row, featured: !!row.featured, active: !!row.active, tours_count: 0, accommodations_count: 0 })
})

app.put('/v3/admin/destinations/:id', requireAdmin, async (req, res) => {
  const { name, slug, region, cover_image, description, featured, active, parent_id } = req.body
  await pool.query(
    'UPDATE destinations SET name=?,slug=?,region=?,cover_image=?,description=?,featured=?,active=?,parent_id=? WHERE id=?',
    [name, slug, region ?? null, cover_image ?? null, description ?? null, featured ? 1 : 0, active ? 1 : 0, parent_id ?? null, req.params.id]
  )
  const [[row]] = await pool.query(`
    SELECT d.*, d2.name AS parent_name,
      (SELECT COUNT(*) FROM Tour t WHERE t.departureZone = d.name AND t.active = 1) AS tours_count,
      (SELECT COUNT(*) FROM accommodations a WHERE a.active = 1 AND a.province = d.region) AS accommodations_count
    FROM destinations d LEFT JOIN destinations d2 ON d2.id = d.parent_id WHERE d.id=?
  `, [req.params.id])
  res.json({ ...row, featured: !!row.featured, active: !!row.active })
})

app.delete('/v3/admin/destinations/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM destinations WHERE id=?', [req.params.id])
  res.json({ ok: true })
})


// ── Public accommodations endpoints ──────────────────────────────────────────
app.get("/v3/accommodations/:slug", async (req, res) => {
  try {
    const [[row]] = await pool.query(
      "SELECT * FROM accommodations WHERE slug = ? AND active = 1",
      [req.params.slug]
    )
    if (!row) return res.status(404).json({ error: "Not found" })

    const [images] = await pool.query(
      "SELECT url, alt, sort_order FROM accommodation_images WHERE accommodationId = ? ORDER BY sort_order",
      [row.id]
    )

    res.json({
      data: {
        ...row,
        featured: !!row.featured,
        coming_soon: !!row.coming_soon,
        active: !!row.active,
        amenities: parseAmenities(row.amenities),
        images,
        avg_rating: null,
        review_count: 0,
      }
    })
  } catch (err) {
    console.error("GET /v3/accommodations/:slug error:", err.message)
    res.status(500).json({ error: "DB error" })
  }
})

app.get("/v3/accommodations/:slug/reviews", async (req, res) => {
  // No reviews table for accommodations yet — return empty structure
  res.json({ reviews: [], total: 0, avg: null, distribution: { r5: 0, r4: 0, r3: 0, r12: 0 } })
})

// ── Accommodations ────────────────────────────────────────────────────────────
function parseAmenities(val) {
  if (!val) return []
  try { return JSON.parse(val) } catch { return val.split(',').map(s => s.trim()).filter(Boolean) }
}

app.get('/v3/admin/accommodations', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM accommodations ORDER BY name')
  res.json(rows.map(r => ({ ...r, featured: !!r.featured, coming_soon: !!r.coming_soon, active: !!r.active, amenities: parseAmenities(r.amenities) })))
})

app.get('/v3/admin/accommodations/:id', requireAdmin, async (req, res) => {
  const [[row]] = await pool.query('SELECT * FROM accommodations WHERE id=?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({ ...row, featured: !!row.featured, coming_soon: !!row.coming_soon, active: !!row.active, amenities: parseAmenities(row.amenities) })
})

app.post('/v3/admin/accommodations', requireAdmin, async (req, res) => {
  const { slug, name, type = 'hotel', short_description, description, address, province,
    stars, price_min, price_max, cover_image, amenities = [], phone, email, website,
    booking_url, featured = false, coming_soon = false, active = true } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const finalSlug = slug || name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  const [result] = await pool.query(`
    INSERT INTO accommodations (slug,name,type,short_description,description,address,province,stars,price_min,price_max,cover_image,amenities,phone,email,website,booking_url,featured,coming_soon,active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, [finalSlug, name, type, short_description||null, description||null, address||null, province||null,
      stars||null, price_min||null, price_max||null, cover_image||null,
      JSON.stringify(amenities), phone||null, email||null, website||null, booking_url||null,
      featured?1:0, coming_soon?1:0, active?1:0])
  const [[row]] = await pool.query('SELECT * FROM accommodations WHERE id=?', [result.insertId])
  syncDestinations()
  res.status(201).json({ ...row, featured: !!row.featured, coming_soon: !!row.coming_soon, active: !!row.active, amenities: parseAmenities(row.amenities) })
})

app.put('/v3/admin/accommodations/:id', requireAdmin, async (req, res) => {
  const { slug, name, type, short_description, description, address, province,
    stars, price_min, price_max, cover_image, amenities, phone, email, website,
    booking_url, featured, coming_soon, active } = req.body
  await pool.query(`
    UPDATE accommodations SET slug=?,name=?,type=?,short_description=?,description=?,address=?,province=?,
    stars=?,price_min=?,price_max=?,cover_image=?,amenities=?,phone=?,email=?,website=?,booking_url=?,
    featured=?,coming_soon=?,active=? WHERE id=?
  `, [slug, name, type||'hotel', short_description||null, description||null, address||null, province||null,
      stars||null, price_min||null, price_max||null, cover_image||null,
      JSON.stringify(amenities||[]), phone||null, email||null, website||null, booking_url||null,
      featured?1:0, coming_soon?1:0, active?1:0, req.params.id])
  const [[row]] = await pool.query('SELECT * FROM accommodations WHERE id=?', [req.params.id])
  syncDestinations()
  res.json({ ...row, featured: !!row.featured, coming_soon: !!row.coming_soon, active: !!row.active, amenities: parseAmenities(row.amenities) })
})

app.delete('/v3/admin/accommodations/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM accommodation_images WHERE accommodationId=?', [req.params.id])
  await pool.query('DELETE FROM accommodations WHERE id=?', [req.params.id])
  syncDestinations()
  res.json({ ok: true })
})

app.patch('/v3/admin/accommodations/:id/toggle-active', requireAdmin, async (req, res) => {
  await pool.query('UPDATE accommodations SET active = NOT active WHERE id=?', [req.params.id])
  const [[row]] = await pool.query('SELECT * FROM accommodations WHERE id=?', [req.params.id])
  syncDestinations()
  res.json({ ...row, featured: !!row.featured, coming_soon: !!row.coming_soon, active: !!row.active, amenities: parseAmenities(row.amenities) })
})

app.patch('/v3/admin/accommodations/:id/toggle-featured', requireAdmin, async (req, res) => {
  await pool.query('UPDATE accommodations SET featured = NOT featured WHERE id=?', [req.params.id])
  const [[row]] = await pool.query('SELECT * FROM accommodations WHERE id=?', [req.params.id])
  res.json({ ...row, featured: !!row.featured, coming_soon: !!row.coming_soon, active: !!row.active, amenities: parseAmenities(row.amenities) })
})

app.get('/v3/admin/accommodations/:id/images', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM accommodation_images WHERE accommodationId=? ORDER BY sort_order', [req.params.id])
  res.json(rows)
})

app.post('/v3/admin/accommodations/:id/images', requireAdmin, async (req, res) => {
  const { url, alt = '' } = req.body
  if (!url) return res.status(400).json({ error: 'url required' })
  const [[{ maxOrder }]] = await pool.query('SELECT COALESCE(MAX(sort_order),0) AS maxOrder FROM accommodation_images WHERE accommodationId=?', [req.params.id])
  const [result] = await pool.query(
    'INSERT INTO accommodation_images (accommodationId, url, alt, sort_order) VALUES (?,?,?,?)',
    [req.params.id, url, alt, maxOrder + 1]
  )
  const [[row]] = await pool.query('SELECT * FROM accommodation_images WHERE id=?', [result.insertId])
  res.status(201).json(row)
})

app.delete('/v3/admin/accommodations/:id/images/:imgId', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM accommodation_images WHERE id=? AND accommodationId=?', [req.params.imgId, req.params.id])
  res.json({ ok: true })
})

// ── Mailer (nodemailer) ────────────────────────────────────────────────────────
const nodemailer = require('nodemailer')

function getMailer() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || '172.18.0.1',
    port:   parseInt(process.env.SMTP_PORT || '25'),
    secure: false,
    ...(process.env.SMTP_USER
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || process.env.SMTP_USER } }
      : {}),
    tls: { rejectUnauthorized: false },
  })
}

const MAIL_FROM = process.env.SMTP_FROM || 'Dominicana Tour <noreply@dominicanatour.com>'

function emailShell(heroColor, heroHtml, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2F2F2">
<tr><td align="center" style="padding:32px 16px 48px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
  <tr><td bgcolor="#111111" style="background-color:#111111;padding:22px 32px;border-radius:12px 12px 0 0">
    <span style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">Dominicana</span><span style="font-size:20px;font-weight:900;color:#1d70b7;letter-spacing:-0.5px">Tour</span>
  </td></tr>
  <tr><td bgcolor="${heroColor}" style="background-color:${heroColor};padding:28px 32px">${heroHtml}</td></tr>
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:32px">${bodyHtml}</td></tr>
  <tr><td bgcolor="#F5F5F5" style="background-color:#F5F5F5;padding:16px 32px;text-align:center;border-top:1px solid #E8E8E8;border-radius:0 0 12px 12px">
    <p style="margin:0;font-size:11px;color:#aaaaaa;line-height:1.7">
      © 2026 Dominicana Tour · República Dominicana<br>
      <a href="https://dominicanatour.com/privacidad" style="color:#bbbbbb;text-decoration:none">Privacidad</a>
      &nbsp;·&nbsp;
      <a href="https://dominicanatour.com/terminos" style="color:#bbbbbb;text-decoration:none">Términos</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

// ── Review Request Email Template ─────────────────────────────────────────────
function reviewRequestHtml(firstName, tourName, tourSlug, code) {
  const hero = `
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.1em">Tu opinión importa</p>
    <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2">¿Cómo fue tu experiencia?</p>`

  const body = `
    <p style="margin:0 0 20px;color:#555555;font-size:15px;line-height:1.65">
      Hola <strong style="color:#111111">${firstName}</strong>, gracias por haber elegido Dominicana Tour.
      Esperamos que hayas disfrutado <strong style="color:#111111">${tourName}</strong>.
    </p>
    <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.65">
      Tu reseña ayuda a otros viajeros a planificar su experiencia en República Dominicana.
      Solo toma 2 minutos.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
      <tr><td align="center">
        <a href="https://dominicanatour.com/reserva/${code}#reseña"
           style="display:inline-block;background-color:#1d70b7;color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
          Dejar mi reseña →
        </a>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;font-size:13px;color:#777777;line-height:1.6">
      ¿O puedes calificarnos en Google? Es de gran ayuda para nosotros:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr><td>
        <a href="https://g.page/r/dominicanatour/review"
           style="display:inline-block;border:1px solid #E8E8E8;color:#555555;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;background-color:#FAFAFA">
          Calificar en Google ★
        </a>
      </td></tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#999999;line-height:1.6">
      ¿Algún problema con tu experiencia? Escríbenos a
      <a href="mailto:info@dominicanatour.com" style="color:#1d70b7;text-decoration:none">info@dominicanatour.com</a>
      y lo resolvemos de inmediato.
    </p>`

  return emailShell('#1d70b7', hero, body)
}

// ── Day-Before Reminder Email Template ────────────────────────────────────────
function reminderHtml(firstName, tourName, tourDate, code) {
  const fecha = tourDate
    ? new Date(tourDate + 'T12:00:00').toLocaleDateString('es-DO',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'mañana'

  const hero = `
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.1em">Tu tour es mañana ✈</p>
    <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2">¡Prepárate, ${firstName}!</p>`

  const body = `
    <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.65">
      Tu excursión <strong style="color:#111111">${tourName}</strong> es
      <strong style="color:#111111;text-transform:capitalize">${fecha}</strong>.
      Aquí lo que necesitas saber:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F0F7FF"
           style="background-color:#F0F7FF;border:1px solid #BFDBFE;border-radius:10px;margin-bottom:24px">
      <tr><td style="padding:16px 20px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 0;color:#888888;font-size:14px;width:40%;border-top:1px solid #DBEAFE;vertical-align:top">Reserva</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;color:#1d70b7;border-top:1px solid #DBEAFE">
              <span style="font-family:'Courier New',Courier,monospace;background-color:#E8F0FB;color:#1d70b7;padding:2px 8px;border-radius:4px">${code}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;font-size:14px;border-top:1px solid #DBEAFE;vertical-align:top">Tour</td>
            <td style="padding:8px 0;font-size:14px;font-weight:500;color:#111111;border-top:1px solid #DBEAFE">${tourName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;font-size:14px;border-top:1px solid #DBEAFE;vertical-align:top">Fecha</td>
            <td style="padding:8px 0;font-size:14px;color:#111111;border-top:1px solid #DBEAFE;text-transform:capitalize">${fecha}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFF7F4"
           style="background-color:#FFF7F4;border-left:3px solid #1d70b7;border-radius:0 8px 8px 0;margin-bottom:24px">
      <tr><td style="padding:14px 18px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1d70b7">Recuerda para mañana</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#666666;line-height:1.9">
          <li>Confirmaremos el horario y punto de recogida por WhatsApp esta noche</li>
          <li>Trae protector solar, traje de baño y ropa cómoda</li>
          <li>El saldo pendiente se paga el día del tour en efectivo o tarjeta</li>
          <li>Cancelación gratuita hasta 48h antes</li>
        </ul>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr><td align="center">
        <a href="https://dominicanatour.com/reserva/${code}"
           style="display:inline-block;background-color:#1d70b7;color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
          Ver detalles de mi reserva →
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:#999999;line-height:1.6">
      ¿Necesitas algo? Escríbenos ahora por
      <a href="https://wa.me/18095550100" style="color:#1d70b7;text-decoration:none">WhatsApp</a>
    </p>`

  return emailShell('#1d70b7', hero, body)
}

// ── POST /v3/admin/send-review-requests ───────────────────────────────────────
app.post('/v3/admin/send-review-requests', requireAdmin, async (req, res) => {
  try {
    // Reservations where tour date was 2 days ago and status is CONFIRMED
    const [rows] = await pool.query(`
      SELECT r.id, r.code, r.firstName, r.email, t.name AS tourName, t.slug AS tourSlug,
             d.date AS tourDate
      FROM Reservation r
      JOIN TourDate d ON d.id = r.tourDateId
      JOIN Tour t ON t.id = d.tourId
      WHERE r.status = 'CONFIRMED'
        AND r.email IS NOT NULL AND r.email != ''
        AND DATE(d.date) = DATE(NOW() - INTERVAL 2 DAY)
    `)

    let sent = 0, skipped = 0
    const mailer = getMailer()
    for (const row of rows) {
      try {
        await mailer.sendMail({
          from:    MAIL_FROM,
          to:      row.email,
          subject: `¿Cómo fue tu experiencia? ${row.tourName}`,
          html:    reviewRequestHtml(row.firstName, row.tourName, row.tourSlug, row.code),
        })
        sent++
      } catch (e) {
        console.error('review mail error:', row.email, e.message)
        skipped++
      }
    }
    res.json({ ok: true, total: rows.length, sent, skipped })
  } catch (e) {
    console.error('/send-review-requests error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ── POST /v3/admin/send-reminders ─────────────────────────────────────────────
app.post('/v3/admin/send-reminders', requireAdmin, async (req, res) => {
  try {
    // Reservations where tour date is tomorrow and status is CONFIRMED
    const [rows] = await pool.query(`
      SELECT r.id, r.code, r.firstName, r.email, t.name AS tourName,
             d.date AS tourDate
      FROM Reservation r
      JOIN TourDate d ON d.id = r.tourDateId
      JOIN Tour t ON t.id = d.tourId
      WHERE r.status = 'CONFIRMED'
        AND r.email IS NOT NULL AND r.email != ''
        AND DATE(d.date) = DATE(NOW() + INTERVAL 1 DAY)
    `)

    let sent = 0, skipped = 0
    const mailer = getMailer()
    for (const row of rows) {
      try {
        await mailer.sendMail({
          from:    MAIL_FROM,
          to:      row.email,
          subject: `Tu tour es mañana — ${row.tourName}`,
          html:    reminderHtml(row.firstName, row.tourName, row.tourDate, row.code),
        })
        sent++
      } catch (e) {
        console.error('reminder mail error:', row.email, e.message)
        skipped++
      }
    }
    res.json({ ok: true, total: rows.length, sent, skipped })
  } catch (e) {
    console.error('/send-reminders error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal error' })
})

const PORT = parseInt(process.env.PORT || '3000')

// Safety net: prevent unhandled rejections from crashing the process
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err && err.message)
})

// ── Tour Images ───────────────────────────────────────────────────────────────
app.post('/v3/admin/tours/:id/images', requireAdmin, async (req, res) => {
  try {
    const { url, alt = '', order = 0 } = req.body
    const [r] = await pool.query(
      'INSERT INTO TourImage (tourId,url,alt,`order`) VALUES (?,?,?,?)',
      [req.params.id, url, alt, order]
    )
    res.json({ ok: true, id: r.insertId, url, alt, order })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/v3/admin/tours/:id/images/:imgId', requireAdmin, async (req, res) => {
  try {
    const { url, alt, order } = req.body
    const fields = [], vals = []
    if (url !== undefined) { fields.push('url=?'); vals.push(url) }
    if (alt !== undefined) { fields.push('alt=?'); vals.push(alt) }
    if (order !== undefined) { fields.push('`order`=?'); vals.push(order) }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' })
    vals.push(req.params.imgId)
    await pool.query(`UPDATE TourImage SET ${fields.join(',')} WHERE id=?`, vals)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/v3/admin/tours/:id/images/:imgId', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM TourImage WHERE id=? AND tourId=?', [req.params.imgId, req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Tour Itinerary ────────────────────────────────────────────────────────────
app.post('/v3/admin/tours/:id/itinerary', requireAdmin, async (req, res) => {
  try {
    const { time = '', title, description = '', order = 0 } = req.body
    const [r] = await pool.query(
      'INSERT INTO ItineraryItem (tourId,time,title,description,`order`) VALUES (?,?,?,?,?)',
      [req.params.id, time, title, description, order]
    )
    res.json({ ok: true, id: r.insertId, time, title, description, order })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/v3/admin/tours/:id/itinerary/:itemId', requireAdmin, async (req, res) => {
  try {
    const { time, title, description, order } = req.body
    const fields = [], vals = []
    if (time !== undefined) { fields.push('time=?'); vals.push(time) }
    if (title !== undefined) { fields.push('title=?'); vals.push(title) }
    if (description !== undefined) { fields.push('description=?'); vals.push(description) }
    if (order !== undefined) { fields.push('`order`=?'); vals.push(order) }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' })
    vals.push(req.params.itemId)
    await pool.query(`UPDATE ItineraryItem SET ${fields.join(',')} WHERE id=?`, vals)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/v3/admin/tours/:id/itinerary/:itemId', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM ItineraryItem WHERE id=? AND tourId=?', [req.params.itemId, req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Tour Includes ─────────────────────────────────────────────────────────────
app.post('/v3/admin/tours/:id/includes', requireAdmin, async (req, res) => {
  try {
    const { text, included = true } = req.body
    const [r] = await pool.query(
      'INSERT INTO TourInclude (tourId,text,included) VALUES (?,?,?)',
      [req.params.id, text, included ? 1 : 0]
    )
    res.json({ ok: true, id: r.insertId, text, included: !!included })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/v3/admin/tours/:id/includes/:incId', requireAdmin, async (req, res) => {
  try {
    const { text, included } = req.body
    const fields = [], vals = []
    if (text !== undefined) { fields.push('text=?'); vals.push(text) }
    if (included !== undefined) { fields.push('included=?'); vals.push(included ? 1 : 0) }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' })
    vals.push(req.params.incId)
    await pool.query(`UPDATE TourInclude SET ${fields.join(',')} WHERE id=?`, vals)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/v3/admin/tours/:id/includes/:incId', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM TourInclude WHERE id=? AND tourId=?', [req.params.incId, req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Tour Date update ──────────────────────────────────────────────────────────
app.patch('/v3/admin/tours/:id/dates/:dateId', requireAdmin, async (req, res) => {
  try {
    const { availableSpots, status } = req.body
    const fields = [], vals = []
    if (availableSpots !== undefined) { fields.push('availableSpots=?'); vals.push(availableSpots) }
    if (status !== undefined) { fields.push('status=?'); vals.push(status) }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' })
    vals.push(req.params.dateId, req.params.id)
    await pool.query(`UPDATE TourDate SET ${fields.join(',')} WHERE id=? AND tourId=?`, vals)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── ERP Create Reservation ────────────────────────────────────────────────────
app.post('/v3/admin/reservations', requireAdmin, async (req, res) => {
  const {
    tourId, tourDateId, firstName, lastName = '', email = '', phone,
    hotel = '', hotelZone = '', language = 'es', adults = 1, children = 0,
    paymentMethod = 'efectivo', notes = '', internalNotes = '', paidDeposit = 0,
  } = req.body
  if (!tourId || !tourDateId || !firstName || !phone)
    return res.status(400).json({ error: 'Faltan campos requeridos: tourId, tourDateId, firstName, phone' })

  const [tours] = await pool.query('SELECT priceAdult, priceChild FROM Tour WHERE id=?', [tourId])
  if (!tours.length) return res.status(404).json({ error: 'Tour no encontrado' })
  const tour = tours[0]

  const totalAmount = Number(tour.priceAdult) * Number(adults) + Number(tour.priceChild || 0) * Number(children)
  const depositAmount = Math.ceil(totalAmount * 0.2 * 100) / 100

  function genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let s = 'DT'
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return s
  }
  const code = genCode()

  const [r] = await pool.query(`
    INSERT INTO Reservation
      (code, tourId, tourDateId, status, firstName, lastName, email, phone,
       country, hotel, hotelZone, language, adults, children,
       totalAmount, depositAmount, paymentMethod, paidDeposit, notes, internalNotes, createdAt, updatedAt)
    VALUES (?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())
  `, [code, tourId, tourDateId, firstName, lastName, email, phone, hotel, hotelZone, language,
      adults, children, totalAmount, depositAmount, paymentMethod, Number(paidDeposit), notes || null, internalNotes || null])

  await pool.query('UPDATE TourDate SET bookedSpots = bookedSpots + ? WHERE id=?', [Number(adults) + Number(children), tourDateId])

  // Auto-create invoice
  try {
    const year = new Date().getFullYear()
    const [[{ n }]] = await pool.query('SELECT COUNT(*)+1 AS n FROM Invoice WHERE YEAR(createdAt)=?', [year])
    const invNum = `DT-${year}-${String(n).padStart(3,'0')}`
    await pool.query(
      'INSERT INTO Invoice (number,reservationId,status,subtotal,discount,total,currency,createdAt) VALUES (?,?,?,?,0,?,?,NOW())',
      [invNum, r.insertId, 'PENDING', totalAmount, totalAmount, 'USD']
    )
  } catch (e) { console.error('Invoice auto-create failed:', e.message) }

  const [rows] = await pool.query(`
    SELECT r.id, r.code, r.status, r.firstName, r.lastName, r.email, r.phone,
           r.adults, r.children, r.totalAmount, r.depositAmount, r.paidDeposit,
           r.paymentMethod, r.notes, r.internalNotes, r.createdAt,
           t.name AS tour_name, t.slug AS tour_slug, d.date AS tour_date
    FROM Reservation r JOIN Tour t ON t.id=r.tourId JOIN TourDate d ON d.id=r.tourDateId
    WHERE r.id=?
  `, [r.insertId])

  res.status(201).json({ ok: true, reservation: rows[0] })
})

// ── Users CRUD ────────────────────────────────────────────────────────────────
app.get('/v3/admin/users/list', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name AS firstName, lastName, email, role, active, lastLogin, createdAt FROM User ORDER BY createdAt DESC'
    )
    res.json(rows.map(u => ({ ...u, active: u.active === 1 || u.active === true })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/v3/admin/users/create', requireAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName = null, role = 'ADMIN' } = req.body
    if (!email || !password || !firstName)
      return res.status(400).json({ error: 'email, password y firstName son requeridos' })
    let hash
    try {
      const bcrypt = require('bcryptjs')
      hash = await bcrypt.hash(password, 12)
    } catch {
      try {
        const bcrypt = require('bcrypt')
        hash = await bcrypt.hash(password, 12)
      } catch {
        const crypto = require('crypto')
        hash = '$plain$' + crypto.createHash('sha256').update(password).digest('hex')
      }
    }
    const [r] = await pool.query(
      'INSERT INTO User (name, lastName, email, password, role, active) VALUES (?,?,?,?,?,1)',
      [firstName, lastName, email, hash, role.toUpperCase()]
    )
    const [[row]] = await pool.query('SELECT id, name AS firstName, lastName, email, role, active, lastLogin, createdAt FROM User WHERE id=?', [r.insertId])
    res.status(201).json({ ...row, active: !!row.active })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/v3/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, role, password } = req.body
    const fields = [], vals = []
    if (firstName) { fields.push('name=?'); vals.push(firstName) }
    if (lastName !== undefined) { fields.push('lastName=?'); vals.push(lastName) }
    if (role) { fields.push('role=?'); vals.push(role.toUpperCase()) }
    if (password) {
      let hash
      try {
        const bcrypt = require('bcryptjs')
        hash = await bcrypt.hash(password, 12)
      } catch {
        try {
          const bcrypt = require('bcrypt')
          hash = await bcrypt.hash(password, 12)
        } catch {
          const crypto = require('crypto')
          hash = '$plain$' + crypto.createHash('sha256').update(password).digest('hex')
        }
      }
      fields.push('password=?'); vals.push(hash)
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' })
    vals.push(req.params.id)
    await pool.query(`UPDATE User SET ${fields.join(',')} WHERE id=?`, vals)
    const [[row]] = await pool.query('SELECT id, name AS firstName, lastName, email, role, active, lastLogin, createdAt FROM User WHERE id=?', [req.params.id])
    res.json({ ...row, active: !!row.active })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/v3/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM User WHERE id=?', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.patch('/v3/admin/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { active } = req.body
    await pool.query('UPDATE User SET active=? WHERE id=?', [active ? 1 : 0, req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})


// ── Public review submit ──────────────────────────────────────────────────────
app.post('/reviews', async (req, res) => {
  try {
    const { tour_id, reservation_code, firstName, country = null, rating = 5, comment = '', language = 'es' } = req.body
    if (!tour_id || !firstName) return res.status(400).json({ error: 'tour_id y firstName requeridos' })
    if (Number(rating) < 1 || Number(rating) > 5) return res.status(400).json({ error: 'rating debe ser 1-5' })
    const [[tour]] = await pool.query('SELECT id FROM Tour WHERE id=? AND active=1', [tour_id])
    if (!tour) return res.status(404).json({ error: 'Tour no encontrado' })
    let reservationId = null
    if (reservation_code) {
      const [[resv]] = await pool.query('SELECT id FROM Reservation WHERE code=?', [reservation_code])
      if (resv) reservationId = resv.id
    }
    const [r] = await pool.query(
      'INSERT INTO Review (tourId,reservationId,firstName,country,rating,comment,language,approved,createdAt) VALUES (?,?,?,?,?,?,?,0,NOW())',
      [tour_id, reservationId, String(firstName).trim(), country, Math.round(Number(rating)), String(comment||'').trim(), language]
    )
    res.json({ ok: true, id: r.insertId })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.listen(PORT, () => console.log(`dominicantour-api v3 running on :${PORT}`))
