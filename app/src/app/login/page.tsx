'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/shared/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    const profileResponse = await fetch('/api/auth/profile')
    const profile = profileResponse.ok ? await profileResponse.json() : null
    router.push(profile?.data?.must_change_password ? '/trocar-senha' : '/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <Image
            src="/brand/FP%20Vault360%20Final.png"
            alt="FP Vault360°"
            width={300}
            height={120}
            priority
            className="h-auto w-[min(82vw,18rem)] object-contain"
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 border-t border-brand-100 pt-6">
          <div className="flex justify-center">
            <Image
              src="/brand/FP%20Solucoes.png"
              alt="FP Soluções"
              width={280}
              height={67}
              priority
              className="h-auto w-[min(76vw,16rem)] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
