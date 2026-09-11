'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleLogout() {
    setLoading(true)
    setError(false)
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      setLoading(false)
      setError(true)
      return
    }

    router.replace('/login')
    router.refresh()
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="mt-6 w-full rounded-md border border-brand-200 px-3 py-2 text-left text-sm font-bold text-brand-900/80 transition hover:bg-brand-50 hover:text-brand-700 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? 'Saindo...' : 'Sair e trocar usuário'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">Não foi possível sair. Tente novamente.</p>}
    </div>
  )
}
