'use client'

import { useState } from 'react'

export function DeleteRecordButton({
  endpoint,
  redirectUrl,
  label = 'Excluir Registro',
}: {
  endpoint: string
  redirectUrl: string
  label?: string
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm('Deseja realmente excluir este registro?')) return

    setIsDeleting(true)

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Exclusão solicitada pela operação',
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível excluir o registro.')
      }

      window.location.assign(redirectUrl)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível excluir o registro.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? 'Excluindo...' : label}
    </button>
  )
}
