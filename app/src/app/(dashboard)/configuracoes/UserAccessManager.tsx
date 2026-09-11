'use client'

import { FormEvent, useEffect, useState } from 'react'

type User = { id: string; full_name: string; email: string; must_change_password: boolean; client_id?: string | null; user_roles?: Array<{ roles?: { code?: string; name?: string } }> }
type Client = { id: string; name: string }

export function UserAccessManager({ clients }: { clients: Client[] }) {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ full_name: '', email: '', password: '', access_type: 'fp', role_code: 'submaster', client_id: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const response = await fetch('/api/admin/users')
    const result = await response.json()
    if (response.ok) setUsers(result.data ?? [])
    else setMessage(result.error ?? 'Não foi possível carregar os acessos.')
  }
  useEffect(() => { void load() }, [])

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, client_id: form.access_type === 'client' ? form.client_id : null }) })
    const result = await response.json()
    setMessage(response.ok ? 'Acesso criado. No primeiro login será exigida troca de senha.' : result.error ?? 'Erro ao criar acesso.')
    if (response.ok) { setForm({ full_name: '', email: '', password: '', access_type: 'fp', role_code: 'submaster', client_id: '' }); await load() }
    setBusy(false)
  }

  async function resetPassword(userId: string) {
    const password = window.prompt('Informe a nova senha temporária (mínimo 8 caracteres):')
    if (!password) return
    const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: userId, password }) })
    setMessage(response.ok ? 'Senha redefinida. O usuário deverá trocá-la no próximo acesso.' : 'Não foi possível redefinir a senha.')
    await load()
  }

  return <div className="mt-6 space-y-6">
    <form onSubmit={submit} className="rounded-lg border border-brand-100 bg-white p-5"><h2 className="font-medium">Criar acesso</h2><div className="mt-4 grid gap-3 md:grid-cols-3">
      <input required placeholder="Nome completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded border px-3 py-2" />
      <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded border px-3 py-2" />
      <input required minLength={8} type="password" placeholder="Senha inicial" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded border px-3 py-2" />
      <select value={form.access_type} onChange={(e) => setForm({ ...form, access_type: e.target.value, role_code: e.target.value === 'client' ? 'client_portal' : 'submaster' })} className="rounded border px-3 py-2"><option value="fp">FP Soluções</option><option value="client">Cliente</option></select>
      <select value={form.role_code} onChange={(e) => setForm({ ...form, role_code: e.target.value })} className="rounded border px-3 py-2">{(form.access_type === 'client' ? [['client_portal', 'Acesso de Cliente']] : [['master01', 'Master01'], ['master02', 'Master02'], ['master03', 'Master03'], ['master04', 'Master04'], ['submaster', 'Sub Master']]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      {form.access_type === 'client' && <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="rounded border px-3 py-2"><option value="">Vincular ao cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>}
    </div><button disabled={busy} className="mt-4 rounded bg-brand-600 px-4 py-2 text-sm text-white">{busy ? 'Criando...' : 'Criar acesso'}</button></form>
    {message && <p role="status" className="text-sm text-brand-700">{message}</p>}
    <div className="overflow-hidden rounded-lg border border-brand-100 bg-white"><table className="w-full text-sm"><thead className="bg-brand-50 text-left"><tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3">Senha</th></tr></thead><tbody className="divide-y divide-brand-50">{users.map((user) => <tr key={user.id}><td className="px-4 py-3">{user.full_name}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">{user.user_roles?.[0]?.roles?.name ?? '—'}{user.client_id ? ' · Cliente vinculado' : ''}</td><td className="px-4 py-3"><button type="button" onClick={() => resetPassword(user.id)} className="text-brand-700 underline">Redefinir senha</button></td></tr>)}</tbody></table></div>
  </div>
}
