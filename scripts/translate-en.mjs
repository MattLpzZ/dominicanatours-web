#!/usr/bin/env node
/**
 * translate-en.mjs
 * Auto-translates missing keys from messages/es.json → messages/en.json
 * using the Groq API (llama-3.1-70b-versatile).
 *
 * Usage:
 *   GROQ_API_KEY=gsk_... node scripts/translate-en.mjs
 *   node scripts/translate-en.mjs --force   # re-translate ALL keys
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir  = dirname(fileURLToPath(import.meta.url));
const root   = join(__dir, '..');
const esPath = join(root, 'messages', 'es.json');
const enPath = join(root, 'messages', 'en.json');

const FORCE   = process.argv.includes('--force');
const API_KEY = process.env.GROQ_API_KEY;
if (!API_KEY) {
  console.error('❌  Set GROQ_API_KEY environment variable first.');
  process.exit(1);
}

// ── flatten / unflatten helpers ────────────────────────────────────────────

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [dotKey, val] of Object.entries(flat)) {
    const parts = dotKey.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] ??= {};
      cur = cur[parts[i]];
    }
    cur[parts.at(-1)] = val;
  }
  return out;
}

// ── load files ─────────────────────────────────────────────────────────────

const esFlat = flatten(JSON.parse(readFileSync(esPath, 'utf8')));
const enRaw  = JSON.parse(readFileSync(enPath, 'utf8'));
const enFlat = flatten(enRaw);

// Find keys that are missing or still identical to Spanish (when FORCE)
const toTranslate = {};
for (const [k, esVal] of Object.entries(esFlat)) {
  const enVal = enFlat[k];
  if (FORCE || enVal === undefined || enVal === null || enVal === '') {
    toTranslate[k] = esVal;
  }
}

if (Object.keys(toTranslate).length === 0) {
  console.log('✅  en.json is already up to date. Nothing to translate.');
  process.exit(0);
}

console.log(`🔤  Translating ${Object.keys(toTranslate).length} key(s)...\n`);

// ── call Groq ──────────────────────────────────────────────────────────────

const SYSTEM = `You are a professional translator for a Dominican Republic tourism website.
Translate the Spanish UI strings to natural, friendly American English.
Keep {placeholders} like {date}, {n}, {pct}, {year}, {count} exactly as-is.
Keep HTML tags and emoji exactly as-is.
Return ONLY a valid JSON object with the same keys and English values. No markdown, no explanation.`;

const USER = `Translate these Spanish strings to English:
${JSON.stringify(toTranslate, null, 2)}`;

const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user',   content: USER },
    ],
  }),
});

if (!res.ok) {
  const err = await res.text();
  console.error('❌  Groq API error:', err);
  process.exit(1);
}

const data = await res.json();
const raw  = data.choices?.[0]?.message?.content?.trim() ?? '';

let translated;
try {
  // Strip possible ```json fences
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  translated = JSON.parse(json);
} catch {
  console.error('❌  Could not parse Claude response as JSON:\n', raw);
  process.exit(1);
}

// ── merge and write ────────────────────────────────────────────────────────

const merged = { ...enFlat, ...translated };
const result = unflatten(merged);

writeFileSync(enPath, JSON.stringify(result, null, 2) + '\n', 'utf8');

console.log(`✅  Translated ${Object.keys(translated).length} key(s):`);
for (const [k, v] of Object.entries(translated)) {
  console.log(`   ${k}: "${v}"`);
}
console.log('\n📄  messages/en.json updated.');
