import { listImportJobs } from '@/modules/imports/service'
import { ImportWizard } from './ImportWizard'

export default async function ImportPage() {
  const jobs = await listImportJobs()
  return <section><h1 className="text-2xl font-semibold">Importação</h1><p className="mt-2 text-sm text-brand-900/70">{jobs.length} processo(s) de importação registrados.</p><ImportWizard /></section>
}
