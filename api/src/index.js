'use strict'
const express    = require('express')
const cors       = require('cors')
const mysql      = require('mysql2/promise')
const jwt        = require('jsonwebtoken')
const cron       = require('node-cron')
const nodemailer = require('nodemailer')

const app = express()
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
  res.json({ ok: true })
})

app.delete('/v3/admin/tours/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM Tour WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

app.patch('/v3/admin/tours/:id/toggle-active', requireAdmin, async (req, res) => {
  await pool.query('UPDATE Tour SET active=NOT active, updatedAt=NOW() WHERE id=?', [req.params.id])
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
  const { status } = req.query
  let query = `
    SELECT r.id, r.code, r.status, r.firstName, r.lastName, r.email, r.phone,
           r.country, r.hotel, r.hotelZone, r.language, r.adults, r.children,
           r.totalAmount, r.depositAmount, r.paymentMethod, r.paidDeposit,
           r.notes, r.internalNotes, r.createdAt,
           t.name AS tour_name, t.slug AS tour_slug, d.date AS tour_date
    FROM Reservation r
    JOIN Tour t ON t.id = r.tourId
    JOIN TourDate d ON d.id = r.tourDateId
  `
  const params = []
  if (status && status !== 'ALL') { query += ' WHERE r.status=?'; params.push(status) }
  query += ' ORDER BY r.createdAt DESC'
  const [rows] = await pool.query(query, params)
  res.json(rows)
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
  const { name, slug, icon = '' } = req.body
  const [r] = await pool.query('INSERT INTO Category (name,slug,icon) VALUES (?,?,?)', [name, slug, icon])
  res.json({ ok: true, id: r.insertId })
})

app.put('/v3/admin/categories/:id', requireAdmin, async (req, res) => {
  const { name, slug, icon } = req.body
  await pool.query('UPDATE Category SET name=?,slug=?,icon=? WHERE id=?', [name, slug, icon, req.params.id])
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
  const [catRows] = await pool.query('SELECT id, name, slug, icon FROM Category ORDER BY name')
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

// ── Email Automation ──────────────────────────────────────────────────────────

function getMailer() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? '172.18.0.1',
    port:   Number(process.env.SMTP_PORT ?? 25),
    secure: false,
    ...(process.env.SMTP_USER
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? process.env.SMTP_USER } }
      : {}),
    tls: { rejectUnauthorized: false },
  })
}
const MAIL_FROM = process.env.SMTP_FROM ?? 'Dominicana Tour <noreply@mail.dynastydom.com>'

async function initEmailLog() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reservation_id INT NOT NULL,
      type VARCHAR(20) NOT NULL,
      sent_at DATETIME DEFAULT NOW(),
      UNIQUE KEY uq_res_type (reservation_id, type)
    )
  `)
}

function emailHeader() {
  return `<div style="background:#111;padding:20px 32px">
    <span style="font-size:18px;font-weight:900;color:#fff;letter-spacing:-.5px">Dominicana</span>
    <span style="font-size:18px;font-weight:900;color:#E85D20;letter-spacing:-.5px">Tour</span>
  </div>`
}
function emailFooter() {
  return `<div style="background:#F5F5F5;padding:14px 32px;text-align:center;border-top:1px solid #E8E8E8">
    <p style="margin:0;font-size:11px;color:#aaa">© 2026 Dominicana Tour · República Dominicana<br>
    <a href="https://dominicanatour.com/privacidad" style="color:#bbb;text-decoration:none">Privacidad</a>
    &nbsp;·&nbsp;
    <a href="https://dominicanatour.com/terminos" style="color:#bbb;text-decoration:none">Términos</a></p>
  </div>`
}

function reviewHtml({ firstName, tourName, reviewUrl }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:540px;margin:32px auto 48px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)">
    ${emailHeader()}
    <div style="background:linear-gradient(135deg,#E85D20,#c94d14);padding:28px 32px">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.1em">Tu opinión importa 🌟</p>
      <p style="margin:0;font-size:24px;font-weight:900;color:#fff">¿Cómo fue tu experiencia, ${firstName}?</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.65">
        Esperamos que hayas disfrutado <strong style="color:#111">${tourName}</strong> con nosotros.
        Tu reseña ayuda a otros viajeros y nos motiva a seguir mejorando cada excursión.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${reviewUrl}" style="display:inline-block;background:#E85D20;color:#fff;font-weight:700;
           font-size:15px;padding:14px 44px;border-radius:10px;text-decoration:none;letter-spacing:.01em">
          ⭐ Dejar mi reseña
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#999;line-height:1.6;text-align:center">
        Solo toma un minuto y significa mucho para nosotros.<br>
        Gracias por elegirnos para tu aventura en República Dominicana.
      </p>
    </div>
    ${emailFooter()}
  </div></body></html>`
}

function reminderHtml({ firstName, tourName, tourDate, departureTime, adults, children, code, waNumber }) {
  const fecha = new Date(tourDate + 'T12:00:00').toLocaleDateString('es-DO',
    { weekday: 'long', day: 'numeric', month: 'long' })
  const pax = children > 0
    ? `${adults} adulto${adults !== 1 ? 's' : ''} + ${children} niño${children !== 1 ? 's' : ''}`
    : `${adults} adulto${adults !== 1 ? 's' : ''}`
  const hora = departureTime || 'Por coordinar'
  const waClean = (waNumber || '18095550100').replace(/\D/g, '')
  const row = (label, value) =>
    `<tr style="border-top:1px solid #BAE6FD">
      <td style="padding:8px 0;color:#888;font-size:14px;width:38%">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#111">${value}</td>
    </tr>`

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:540px;margin:32px auto 48px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)">
    ${emailHeader()}
    <div style="background:linear-gradient(135deg,#0369a1,#0284c7);padding:28px 32px">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.1em">Recordatorio — mañana es tu día 🗺️</p>
      <p style="margin:0;font-size:24px;font-weight:900;color:#fff">¡${firstName}, prepárate para mañana!</p>
    </div>
    <div style="padding:32px">
      <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#888;font-size:14px;width:38%">Tour</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;color:#111">${tourName}</td>
          </tr>
          ${row('Fecha', `<span style="text-transform:capitalize">${fecha}</span>`)}
          ${row('Hora de salida', `<strong style="color:#0369a1">${hora}</strong>`)}
          ${row('Personas', pax)}
          ${row('Código', `<span style="font-family:monospace;background:#FFF3ED;color:#E85D20;padding:2px 8px;border-radius:4px">${code}</span>`)}
        </table>
      </div>

      <div style="background:#FFF7ED;border-left:3px solid #E85D20;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#E85D20">Para mañana</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#666;line-height:1.85">
          <li>Estaremos pasando por tu hotel según lo coordinado</li>
          <li>Llega al lobby <strong>10 minutos antes</strong> de la hora de salida</li>
          <li>Trae ropa cómoda y protector solar</li>
          <li>El saldo restante se paga el día del tour</li>
        </ul>
      </div>

      <div style="text-align:center;margin-bottom:24px;display:flex;gap:8px;justify-content:center">
        <a href="https://wa.me/${waClean}" style="display:inline-block;background:#25D366;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none">
          WhatsApp
        </a>
        <a href="https://dominicanatour.com/reserva/${code}" style="display:inline-block;background:#E85D20;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none">
          Ver mi reserva
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#999;line-height:1.6;text-align:center">
        ¿Cambios de último minuto? Escríbenos por WhatsApp antes de las 8pm.
      </p>
    </div>
    ${emailFooter()}
  </div></body></html>`
}

// ── Email send functions ───────────────────────────────────────────────────────

async function sendReviewEmails({ dryRun = false } = {}) {
  const [cfgRows] = await pool.query("SELECT value FROM site_configs WHERE `key`='google_review_url'")
  const reviewUrl = cfgRows.length ? cfgRows[0].value : null

  const [rows] = await pool.query(`
    SELECT r.id, r.firstName, r.email, r.code, t.name AS tour_name, t.slug
    FROM Reservation r
    JOIN TourDate d ON d.id = r.tourDateId
    JOIN Tour t ON t.id = r.tourId
    WHERE r.email IS NOT NULL AND r.email != ''
    AND r.status IN ('CONFIRMED', 'COMPLETED')
    AND DATE(d.date) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY))
    AND r.id NOT IN (SELECT reservation_id FROM email_log WHERE type = 'review')
  `)

  if (dryRun) return { count: rows.length, emails: rows.map(r => r.email) }

  const mailer = getMailer()
  let sent = 0, failed = 0
  for (const r of rows) {
    try {
      await mailer.sendMail({
        from:    MAIL_FROM,
        to:      r.email,
        subject: `¿Cómo fue ${r.tour_name}? — Dominicana Tour`,
        html:    reviewHtml({
          firstName: r.firstName,
          tourName:  r.tour_name,
          reviewUrl: reviewUrl || `https://dominicanatour.com/excursiones/${r.slug}`,
        }),
      })
      await pool.query('INSERT IGNORE INTO email_log (reservation_id, type) VALUES (?, ?)', [r.id, 'review'])
      sent++
    } catch (err) {
      console.error(`[review-email] failed id=${r.id}: ${err.message}`)
      failed++
    }
  }
  console.log(`[review-email] sent=${sent} failed=${failed} total=${rows.length}`)
  return { sent, failed, total: rows.length }
}

async function sendReminderEmails({ dryRun = false } = {}) {
  const [cfgRows] = await pool.query(
    "SELECT `key`, value FROM site_configs WHERE `key` IN ('whatsapp', 'wa_number')"
  )
  const cfg = {}
  cfgRows.forEach(r => { cfg[r.key] = r.value })
  const waNumber = cfg.whatsapp || cfg.wa_number || '18095550100'

  const [rows] = await pool.query(`
    SELECT r.id, r.firstName, r.email, r.code, r.adults, r.children,
           t.name AS tour_name, t.departureTime AS departure_time,
           DATE_FORMAT(d.date, '%Y-%m-%d') AS tour_date
    FROM Reservation r
    JOIN TourDate d ON d.id = r.tourDateId
    JOIN Tour t ON t.id = r.tourId
    WHERE r.email IS NOT NULL AND r.email != ''
    AND r.status IN ('PENDING', 'CONFIRMED')
    AND DATE(d.date) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
    AND r.id NOT IN (SELECT reservation_id FROM email_log WHERE type = 'reminder')
  `)

  if (dryRun) return { count: rows.length, emails: rows.map(r => r.email) }

  const mailer = getMailer()
  let sent = 0, failed = 0
  for (const r of rows) {
    try {
      await mailer.sendMail({
        from:    MAIL_FROM,
        to:      r.email,
        subject: `Tu excursión es mañana — ${r.tour_name}`,
        html:    reminderHtml({
          firstName:     r.firstName,
          tourName:      r.tour_name,
          tourDate:      r.tour_date,
          departureTime: r.departure_time,
          adults:        r.adults,
          children:      r.children,
          code:          r.code,
          waNumber,
        }),
      })
      await pool.query('INSERT IGNORE INTO email_log (reservation_id, type) VALUES (?, ?)', [r.id, 'reminder'])
      sent++
    } catch (err) {
      console.error(`[reminder-email] failed id=${r.id}: ${err.message}`)
      failed++
    }
  }
  console.log(`[reminder-email] sent=${sent} failed=${failed} total=${rows.length}`)
  return { sent, failed, total: rows.length }
}

// ── Admin: manual trigger + dry-run preview ───────────────────────────────────

app.post('/v3/admin/send-review-requests', requireAdmin, async (req, res) => {
  const result = await sendReviewEmails()
  res.json({ ok: true, ...result })
})

app.post('/v3/admin/send-reminders', requireAdmin, async (req, res) => {
  const result = await sendReminderEmails()
  res.json({ ok: true, ...result })
})

app.get('/v3/admin/email-preview', requireAdmin, async (req, res) => {
  const [reviews, reminders] = await Promise.all([
    sendReviewEmails({ dryRun: true }),
    sendReminderEmails({ dryRun: true }),
  ])
  res.json({ reviews, reminders })
})

// ── Cron: 9am RD (UTC-4) = 13:00 UTC ─────────────────────────────────────────
initEmailLog()
  .then(() => {
    cron.schedule('0 13 * * *', () => {
      sendReviewEmails().catch(e => console.error('[cron-review]', e.message))
    })
    cron.schedule('0 13 * * *', () => {
      sendReminderEmails().catch(e => console.error('[cron-reminder]', e.message))
    })
    console.log('[email-cron] ready — reviews & reminders at 9am RD time (13:00 UTC)')
  })
  .catch(e => console.error('[email-cron] init failed:', e.message))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal error' })
})

const PORT = parseInt(process.env.PORT || '3000')
app.listen(PORT, () => console.log(`dominicantour-api v3 running on :${PORT}`))
