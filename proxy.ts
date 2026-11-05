import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { recordImpression } from '@/lib/events'
import {
  COOKIE,
  SESSION_WINDOW,
  THIRTY_DAYS,
  assignVariant,
  cookieOptions,
  isCrawler,
  isVariant,
  type Variant,
} from '@/lib/experiment'

export async function proxy(request: NextRequest) {
  // 1. El preview es un instrumento: no asigna, no escribe cookies, no cuenta.
  if (request.nextUrl.searchParams.has('preview')) {
    return NextResponse.next()
  }

  // 2. Un crawler ve siempre el control: sin cookie, sin asignación, sin contar visita.
  if (isCrawler(request.headers.get('user-agent'))) {
    return NextResponse.next()
  }

  // 3. Next precarga los links en segundo fondo. Eso no es una visita.
  if (request.headers.has('next-router-prefetch') || request.headers.get('purpose') === 'prefetch') {
    return NextResponse.next()
  }

  // 4. Visitante: el guardado, o uno nuevo con la variante derivada del hash.
  const savedVisitor = request.cookies.get(COOKIE.visitor)?.value
  const savedVariant = request.cookies.get(COOKIE.variant)?.value
  const isNewVisitor = !savedVisitor || !isVariant(savedVariant)

  const visitorId = savedVisitor ?? crypto.randomUUID()
  const variant: Variant = !isNewVisitor && isVariant(savedVariant) ? savedVariant : assignVariant(visitorId)

  // Para que page.tsx vea la variante ya en este primer request.
  if (isNewVisitor) {
    request.cookies.set(COOKIE.visitor, visitorId)
    request.cookies.set(COOKIE.variant, variant)
  }
  const response = NextResponse.next({ request: { headers: request.headers } })
  const secure = request.nextUrl.protocol === 'https:'

  if (isNewVisitor) {
    response.cookies.set(COOKIE.visitor, visitorId, cookieOptions(secure, THIRTY_DAYS))
    response.cookies.set(COOKIE.variant, variant, cookieOptions(secure, THIRTY_DAYS))
  }

  // 5. Una impresión por sesión de 30 minutos.
  if (!request.cookies.has(COOKIE.impressed)) {
    try {
      await recordImpression(visitorId, variant)
      response.cookies.set(COOKIE.impressed, '1', cookieOptions(secure, SESSION_WINDOW))
    } catch (error) {
      // Si la base falla, la página se muestra igual. Sin la cookie, se reintenta en la próxima carga.
      console.error('No se pudo anotar la impresión', error)
    }
  }

  return response
}

export const config = {
  matcher: ['/practica'],
}
