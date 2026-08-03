export const ZONE_COORDS: Record<string, [number, number]> = {
  'punta cana':               [18.5820, -68.4051],
  'bavaro':                   [18.6895, -68.4434],
  'santo domingo':            [18.4861, -69.9312],
  'puerto plata':             [19.7947, -70.6877],
  'samaná':                   [19.2086, -69.3361],
  'samana':                   [19.2086, -69.3361],
  'la romana':                [18.4274, -68.9724],
  'barahona':                 [18.2095, -71.0995],
  'santiago':                 [19.4517, -70.6970],
  'jarabacoa':                [19.1145, -70.6396],
  'constanza':                [18.9072, -70.7450],
  'monte cristi':             [19.8660, -71.6517],
  'pedernales':               [18.0375, -71.7447],
  'higüey':                   [18.6143, -68.7070],
  'boca chica':               [18.4549, -69.6075],
  'juan dolio':               [18.4424, -69.4703],
  'cabarete':                 [19.7547, -70.4092],
  'sosúa':                    [19.7651, -70.5158],
  'las terrenas':             [19.3082, -69.5360],
}

export function getZoneCoords(zone: string): [number, number] | null {
  const normalized = zone.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  for (const [key, coords] of Object.entries(ZONE_COORDS)) {
    const normKey = key.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (normalized.includes(normKey) || normKey.includes(normalized)) return coords
  }
  return [18.7357, -70.1627] // center of DR as fallback
}
