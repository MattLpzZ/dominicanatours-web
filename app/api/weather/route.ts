import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone')
  if (!zone) return NextResponse.json({ error: 'zone required' }, { status: 400 })
  try {
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(zone)},Dominican%20Republic?format=j1`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) throw new Error('wttr.in error')
    const data = await res.json()
    const c = data.current_condition?.[0]
    if (!c) throw new Error('no data')
    return NextResponse.json({
      tempC: c.temp_C,
      desc: c.weatherDesc?.[0]?.value ?? '',
      feels: c.FeelsLikeC,
      humidity: c.humidity,
      windKmph: c.windspeedKmph,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
    })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
