import { sql } from './db'
import { parseLog, type ExperimentLog, type Variant } from './experiment'

// Lee los conteos por variante y los valida con parseLog antes de usarlos.
export async function readLog(): Promise<ExperimentLog> {
  const rows = await sql`
    SELECT v.variant,
      (SELECT count(*) FROM impressions i WHERE i.variant = v.variant)::int AS impressions,
      (SELECT count(*) FROM conversions c WHERE c.variant = v.variant)::int AS conversions
    FROM (VALUES ('a'), ('b')) AS v(variant)
  `

  const raw: Record<string, unknown> = {}
  for (const row of rows) {
    raw[row.variant] = { impressions: row.impressions, conversions: row.conversions }
  }
  return parseLog(JSON.stringify(raw))
}

// Una fila por impresión. La regla de "una por sesión" la decide el proxy.
export async function recordImpression(visitorId: string, variant: Variant): Promise<void> {
  await sql`INSERT INTO impressions (visitor_id, variant) VALUES (${visitorId}, ${variant})`
}
