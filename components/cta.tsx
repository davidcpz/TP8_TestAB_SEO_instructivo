'use client'

import { useState, useTransition } from 'react'
import { recordConversion, type ConversionStatus } from '@/app/practica/actions'

type CtaState = ConversionStatus | 'preview'

const MESSAGES: Record<CtaState, string> = {
  recorded: 'Listo: tu clic quedó registrado como conversión.',
  already: 'Ya habías hecho clic. La conversión se cuenta una sola vez por visitante.',
  unassigned: 'No hay variante asignada: el clic no se cuenta.',
  error: 'No se pudo registrar el clic. Probá de nuevo.',
  preview: 'Vista previa: el clic no se cuenta como conversión.',
}

export function Cta({ label, preview = false }: { label: string; preview?: boolean }) {
  const [state, setState] = useState<CtaState | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (preview) {
            setState('preview')
            return
          }
          startTransition(async () => {
            const result = await recordConversion()
            setState(result.status)
          })
        }}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {label}
      </button>
      <p className="max-w-md text-sm text-muted-foreground">
        {state ? MESSAGES[state] : 'La conversión se anota solo acá. Cargar la página no cuenta.'}
      </p>
    </div>
  )
}
