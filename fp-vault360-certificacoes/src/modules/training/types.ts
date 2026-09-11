export type CertificationStatus = 'valid' | 'expiring_soon' | 'expired'

// Catálogo de tipos de certificação (ex.: NR-35, NR-33, Espaço Confinado).
export interface Certification {
  id: string
  tenant_id: string
  name: string
  code: string | null
  validity_months: number | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface CertificationInput {
  name: string
  code?: string
  validity_months?: number
  description?: string
}

// Catálogo de treinamentos/cursos que podem levar a uma certificação.
export interface Training {
  id: string
  tenant_id: string
  name: string
  certification_id: string | null
  provider: string | null
  created_at: string
  updated_at: string
}

export interface TrainingInput {
  name: string
  certification_id?: string
  provider?: string
}

// Registro efetivo de uma certificação emitida para um colaborador. O campo
// `status` é uma coluna gerada pelo banco (valid/expiring_soon/expired) a
// partir de expires_at — nunca é enviado em inserts/updates.
export interface UserCertification {
  id: string
  tenant_id: string
  user_id: string
  certification_id: string
  training_id: string | null
  issued_at: string
  expires_at: string | null
  status: CertificationStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface UserCertificationInput {
  user_id: string
  certification_id: string
  training_id?: string
  issued_at: string
  expires_at?: string
  notes?: string
}

export interface TenantUserOption {
  id: string
  full_name: string
}
