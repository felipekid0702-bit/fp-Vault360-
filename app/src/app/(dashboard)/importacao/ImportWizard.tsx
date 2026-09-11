'use client'

import { useState } from 'react'

type Preview = { totalRows: number; validRows: number; errorRows: number; errors: Array<{ row_number: number; message: string }> }

export function ImportWizard() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [filePath, setFilePath] = useState<string>()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function inspect() {
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      const uploadBody = new FormData()
      uploadBody.append('file', file)
      const upload = await fetch('/api/importacao/upload', { method: 'POST', body: uploadBody }).then((response) => response.json())
      if (!upload.data) throw new Error(upload.error ?? 'Falha no upload')
      setFilePath(upload.data.path)

      const previewBody = new FormData()
      previewBody.append('file', file)
      const result = await fetch('/api/importacao/preview', { method: 'POST', body: previewBody }).then((response) => response.json())
      if (!result.data) throw new Error(result.error ?? 'Falha na validação')
      setPreview(result.data)
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function process() {
    if (!filePath || !preview) return
    setBusy(true)
    try {
      const job = await fetch('/api/importacao', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ entity: 'equipment', file_path: filePath, total_rows: preview.totalRows }) }).then((response) => response.json())
      if (!job.data?.id) throw new Error(job.error ?? 'Falha ao criar importação')
      const result = await fetch(`/api/importacao/${job.data.id}/process`, { method: 'POST' }).then((response) => response.json())
      if (!result.data) throw new Error(result.error ?? 'Falha ao processar importação')
      setMessage(`${result.data.inserted} equipamento(s) importado(s); ${result.data.errors} erro(s).`)
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="mt-6 max-w-xl space-y-4 rounded-lg border border-brand-100 bg-white p-5">
    <a href="/api/importacao/modelo" className="inline-block text-sm font-medium text-brand-700 underline">Baixar planilha modelo</a>
    <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
    <div className="flex gap-2">
      <button type="button" disabled={!file || busy} onClick={inspect} className="rounded-md bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50">Validar arquivo</button>
      <button type="button" disabled={!preview || busy || preview.validRows === 0} onClick={process} className="rounded-md border border-brand-200 px-4 py-2 text-sm disabled:opacity-50">Importar equipamentos</button>
    </div>
    {preview && <p className="text-sm">{preview.totalRows} linhas; {preview.validRows} válidas; {preview.errorRows} com erro.</p>}
    {preview?.errors.length ? <ul className="text-sm text-red-700">{preview.errors.slice(0, 8).map((error) => <li key={`${error.row_number}-${error.message}`}>Linha {error.row_number}: {error.message}</li>)}</ul> : null}
    {message && <p className="text-sm text-brand-900/70">{message}</p>}
  </div>
}
