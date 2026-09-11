'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [values, setValues] = useState({ current_password: '', new_password: '', confirmation: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    const response = await fetch('/api/auth/password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) })
    const result = await response.json()
    if (!response.ok) { setError(result.error ?? 'Não foi possível alterar a senha.'); setSaving(false); return }
    router.replace('/dashboard'); router.refresh()
  }
  return <main className="flex min-h-screen items-center justify-center bg-brand-50 px-4"><form onSubmit={submit} className="w-full max-w-md rounded-xl border border-brand-100 bg-white p-8 shadow-sm"><h1 className="text-xl font-semibold">Troca obrigatória de senha</h1><p className="mt-2 text-sm text-brand-900/70">Defina uma nova senha antes de acessar o sistema.</p><div className="mt-6 space-y-4">{[['current_password', 'Senha atual'], ['new_password', 'Nova senha'], ['confirmation', 'Confirmar nova senha']].map(([key, label]) => <label key={key} className="block text-sm font-medium">{label}<input required type="password" minLength={8} value={values[key as keyof typeof values]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 block w-full rounded border px-3 py-2 font-normal" /></label>)}</div>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={saving} className="mt-6 w-full rounded bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Atualizando...' : 'Atualizar senha'}</button></form></main>
}
