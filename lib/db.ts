import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('Falta DATABASE_URL. Revisá el archivo .env.local')
}

export const sql = neon(url)
