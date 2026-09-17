'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-brand-900">Não foi possível carregar esta página</h1>
      <p className="mt-2 text-sm text-brand-900/70">O erro foi registrado. Tente novamente ou volte ao painel.</p>
      <button type="button" onClick={() => reset()} className="mt-5 rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white">Tentar novamente</button>
    </main>
  )
}