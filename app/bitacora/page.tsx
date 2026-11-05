import type { Metadata } from 'next'
import Link from 'next/link'
import { readLog } from '@/lib/events'
import {
  assignVariant,
  HASH_EXAMPLE_ID,
  TEST_CASE,
  VARIANTS,
  conversionRate,
  formatCount,
  formatPoints,
  formatRate,
  rateGap,
  type ExperimentLog,
  type Variant,
} from '@/lib/experiment'

export const metadata: Metadata = {
  title: 'Bitácora',
  robots: { index: false, follow: false },
}

// Se calcula en cada visita: los conteos cambian, no se puede cachear.
export const dynamic = 'force-dynamic'

const ROWS: Variant[] = ['a', 'b']

function LogTable({ log, caption }: { log: ExperimentLog; caption: string }) {
  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-left text-sm">
        <caption className="mb-3 text-left text-muted-foreground">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 font-medium">Variante</th>
            <th className="py-2 font-medium">Impresiones</th>
            <th className="py-2 font-medium">Conversiones</th>
            <th className="py-2 font-medium">Tasa</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((variant) => (
            <tr key={variant} className="border-b border-border">
              <td className="py-3">
                {variant.toUpperCase()} · {VARIANTS[variant].name}
              </td>
              <td className="py-3 font-mono">{formatCount(log[variant].impressions)}</td>
              <td className="py-3 font-mono">{formatCount(log[variant].conversions)}</td>
              <td className="py-3 font-mono">{formatRate(conversionRate(log[variant]))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-mono text-sm">B − A = {formatPoints(rateGap(log))}</p>
    </div>
  )
}

export default async function BitacoraPage() {
  const live = await readLog()

  return (
    <main id="contenido" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:py-14">
      <p className="font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">Bitácora</p>
      <h1 className="max-w-2xl font-serif text-4xl tracking-tight text-balance md:text-5xl">
        Impresiones, conversiones y tasa.
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
        La tasa es conversiones dividido impresiones. Sin impresiones no hay tasa. No se declara ganador: una
        diferencia entre tasas no es una prueba.
      </p>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Experimento en vivo</h2>
        <LogTable log={live} caption="Eventos guardados en la base. Una impresión por sesión de 30 minutos, una conversión por visitante." />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Caso de prueba fijo</h2>
        <LogTable log={TEST_CASE} caption="Cohorte fija para corregir el cálculo: A 7,50%, B 13,14%, diferencia 5,64 pp." />
      </section>

      <p className="font-mono text-sm">
        assignVariant({`'${HASH_EXAMPLE_ID}'`}) → {assignVariant(HASH_EXAMPLE_ID).toUpperCase()}
      </p>
      <Link href="/practica" className="text-sm text-muted-foreground underline">
        Volver a la landing
      </Link>
    </main>
  )
}
