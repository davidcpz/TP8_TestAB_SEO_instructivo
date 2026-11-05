'use server'

import { cookies } from 'next/headers'
import { insertConversion } from '@/lib/events'
import { COOKIE, isVariant } from '@/lib/experiment'

export type ConversionStatus = 'recorded' | 'already' | 'unassigned' | 'error'

export async function recordConversion(): Promise<{ status: ConversionStatus }> {
  const cookieStore = await cookies()
  const visitorId = cookieStore.get(COOKIE.visitor)?.value
  const variant = cookieStore.get(COOKIE.variant)?.value

  // Sin asignación no hay experimento: no se anota nada.
  if (!visitorId || !isVariant(variant)) {
    return { status: 'unassigned' }
  }

  try {
    const saved = await insertConversion(visitorId, variant)
    return { status: saved ? 'recorded' : 'already' }
  } catch (error) {
    console.error('No se pudo anotar la conversión', error)
    return { status: 'error' }
  }
}
