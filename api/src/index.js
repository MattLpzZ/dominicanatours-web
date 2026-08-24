'use strict'
const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const jwt = require('jsonwebtoken')

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

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal error' })
})

const PORT = parseInt(process.env.PORT || '3000')
app.listen(PORT, () => console.log(`dominicantour-api v3 running on :${PORT}`))
