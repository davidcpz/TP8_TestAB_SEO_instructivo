import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { COOKIE, THIRTY_DAYS, assignVariant, cookieOptions, isVariant } from '@/lib/experiment'

export function proxy(request: NextRequest) {
  // 1. El preview es un instrumento: no asigna ni escribe cookies.
  if (request.nextUrl.searchParams.has('preview')) {
    return NextResponse.next()
  }

  // 2. Si ya tiene visitante y variante válidos, no se toca nada.
  const savedVisitor = request.cookies.get(COOKIE.visitor)?.value
  const savedVariant = request.cookies.get(COOKIE.variant)?.value
  if (savedVisitor && isVariant(savedVariant)) {
    return NextResponse.next()
  }

  // 3. Visitante nuevo: ID aleatorio una sola vez, variante derivada con el hash.
  const visitorId = savedVisitor ?? crypto.randomUUID()
  const variant = assignVariant(visitorId)

  // Para que page.tsx vea la variante YA en este primer request.
  request.cookies.set(COOKIE.visitor, visitorId)
  request.cookies.set(COOKIE.variant, variant)
  const response = NextResponse.next({ request: { headers: request.headers } })

  // Para que el navegador las guarde y las mande en los próximos requests.
  const secure = request.nextUrl.protocol === 'https:'
  response.cookies.set(COOKIE.visitor, visitorId, cookieOptions(secure, THIRTY_DAYS))
  response.cookies.set(COOKIE.variant, variant, cookieOptions(secure, THIRTY_DAYS))

  return response
}

export const config = {
  matcher: ['/practica'],
}
