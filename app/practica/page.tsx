import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Landing } from '@/components/landing'
import {
  CANONICAL_PATH,
  COOKIE,
  DESCRIPTION_RANGE,
  TITLE_RANGE,
  VARIANTS,
  characterCount,
  inRange,
  isVariant,
  type Variant,
} from '@/lib/experiment'

type PracticaPageProps = {
  searchParams: Promise<{ preview?: string | string[] }>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Decide qué variante se muestra. La usan la página y los metadatos,
// así las dos siempre coinciden.
async function resolveView(searchParams: PracticaPageProps['searchParams']) {
  const params = await searchParams
  const requested = firstParam(params.preview)
  const preview: Variant | null = isVariant(requested) ? requested : null

  const cookieStore = await cookies()
  const assigned = cookieStore.get(COOKIE.variant)?.value

  const variant: Variant = preview ?? (isVariant(assigned) ? assigned : 'a')
  return { preview, variant }
}

export async function generateMetadata({ searchParams }: PracticaPageProps): Promise<Metadata> {
  const { preview, variant } = await resolveView(searchParams)
  const copy = VARIANTS[variant]

  return {
    title: { absolute: copy.seoTitle },
    description: copy.seoDescription,
    alternates: { canonical: CANONICAL_PATH },
    robots: preview ? { index: false, follow: false } : { index: true, follow: true },
  }
}

export default async function PracticaPage({ searchParams }: PracticaPageProps) {
  const { preview, variant } = await resolveView(searchParams)
  const copy = VARIANTS[variant]
  const titleLength = characterCount(copy.seoTitle)
  const descriptionLength = characterCount(copy.seoDescription)

  return (
    <main id="contenido" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:py-14">
      <p className="border-b border-border pb-4 text-sm text-muted-foreground">
        {preview
          ? `Vista previa del copy ${preview.toUpperCase()}. No modifica tu asignación y lleva noindex.`
          : `Variante asignada: ${variant.toUpperCase()}. Recargar no la cambia.`}
      </p>
      <Landing variant={variant} />
      <div className="flex flex-wrap gap-2">
        <Link href="/practica?preview=a" className="rounded-md border border-border px-3 py-1.5 text-sm">
          Ver copy A
        </Link>
        <Link href="/practica?preview=b" className="rounded-md border border-border px-3 py-1.5 text-sm">
          Ver copy B
        </Link>
        <Link href="/bitacora" className="rounded-md border border-border px-3 py-1.5 text-sm">
          Bitácora
        </Link>
      </div>
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Metadatos publicados</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <dt className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
              Title de {variant.toUpperCase()}
            </dt>
            <dd>{copy.seoTitle}</dd>
            <dd className="font-mono text-sm text-muted-foreground">
              {titleLength} caracteres · {inRange(titleLength, TITLE_RANGE) ? 'dentro de 50–60' : 'fuera de rango'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <dt className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
              Description de {variant.toUpperCase()}
            </dt>
            <dd>{copy.seoDescription}</dd>
            <dd className="font-mono text-sm text-muted-foreground">
              {descriptionLength} caracteres ·{' '}
              {inRange(descriptionLength, DESCRIPTION_RANGE) ? 'dentro de 140–160' : 'fuera de rango'}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
