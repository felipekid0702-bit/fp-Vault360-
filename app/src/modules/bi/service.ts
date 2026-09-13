import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function calculatePercent(part: number, total: number) {
  if (!total) return 0
  return Number(((part / total) * 100).toFixed(2))
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const key = getKey(item)
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})
}

function normalizeLabel(value?: string | null) {
  return value?.trim() || 'Não informado'
}

function calculateHealthScore(expiredCount: number, rejectedCount: number, expiringSoonCount: number) {
  return Math.max(0, Math.min(100, 100 - expiredCount * 5 - rejectedCount * 3 - expiringSoonCount * 2))
}

function buildMonthSeries() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      label: date.toLocaleDateString('pt-BR', { month: 'short' }),
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    }
  })
}

export async function getDashboardSummary() {
  const supabase = createServerSupabaseClient()

  const [
    equipmentSummary,
    complianceSummary,
    trainingSummary,
    operationsSummary,
    equipmentResult,
    inspectionsResult,
    categoriesResult,
    manufacturersResult,
    clientsResult,
    servicesResult,
    quarantineResult,
    maintenanceResult,
    disposalResult,
    auditResult,
    trainingStatusResult,
    rejectionReasonsResult,
  ] = await Promise.all([
    supabase.from('v_equipment_summary').select('*').maybeSingle(),
    supabase.from('v_compliance_rate').select('*').maybeSingle(),
    supabase.from('v_training_status').select('*').maybeSingle(),
    supabase.from('v_fp_operations_summary').select('*').maybeSingle(),
    supabase.from('equipment').select('id, model, serial_number, status, owner_type, expiration_date, category_id, category:equipment_categories(name), manufacturer:manufacturers(name), client:clients(name), created_at').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('inspections').select('id, result, verdict, performed_at, equipment_id, inspection_location, notes, equipment:equipment(model, serial_number, internal_code, category:equipment_categories(name), client:clients(name), owner_type)').is('deleted_at', null).order('performed_at', { ascending: false }),
    supabase.from('equipment_categories').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('manufacturers').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('clients').select('id, name, status').is('deleted_at', null).order('name'),
    supabase.from('services').select('id, name, work_order, status, client_id, client:clients(name)').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('quarantine_cases').select('id, equipment_id, reason, status, opened_at, closed_at').order('opened_at', { ascending: false }),
    supabase.from('maintenance_records').select('id, status, maintenance_type, started_at, completed_at').order('started_at', { ascending: false }),
    supabase.from('disposal_records').select('id, reason, disposed_at').order('disposed_at', { ascending: false }),
    supabase.from('audit_log').select('id, action, entity, created_at, metadata').order('created_at', { ascending: false }).limit(50),
    supabase.from('user_certifications').select('id, status, expires_at, issued_at, user_id, certification:certifications(name), user:users(full_name)').order('expires_at', { ascending: true }),
    supabase.from('inspection_items_result').select('id, classification, checklist_items(label, section)').order('id', { ascending: false }),
  ])

  const equipmentSummaryData = equipmentSummary.data ?? {}
  const complianceSummaryData = complianceSummary.data ?? {}
  const trainingSummaryData = trainingSummary.data ?? {}
  const operationsSummaryData = operationsSummary.data ?? {}

  const equipment: any[] = equipmentResult.data ?? []
  const inspections: any[] = inspectionsResult.data ?? []
  const categories: any[] = categoriesResult.data ?? []
  const manufacturers: any[] = manufacturersResult.data ?? []
  const clients: any[] = clientsResult.data ?? []
  const services: any[] = servicesResult.data ?? []
  const quarantineCases: any[] = quarantineResult.data ?? []
  const maintenanceRecords: any[] = maintenanceResult.data ?? []
  const disposalRecords: any[] = disposalResult.data ?? []
  const auditEvents: any[] = auditResult.data ?? []
  const trainingRecords: any[] = trainingStatusResult.data ?? []
  const rejectionReasons: any[] = rejectionReasonsResult.data ?? []

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const currentYearStart = new Date(now.getFullYear(), 0, 1)

  const totalEquipment = equipment.length
  const totalActive = equipment.filter((item) => item.status === 'active').length
  const totalFp = equipment.filter((item) => item.owner_type === 'fp').length
  const totalClientsInventory = equipment.filter((item) => item.owner_type === 'client').length
  const totalBlocked = equipment.filter((item) => item.status === 'blocked').length
  const totalQuarantine = equipment.filter((item) => item.status === 'quarantine').length
  const totalRetired = equipment.filter((item) => item.status === 'retired').length
  const totalLost = equipment.filter((item) => item.status === 'lost').length
  const expiredCount = equipment.filter((item) => item.expiration_date && new Date(item.expiration_date) < now).length
  const expiringSoonCount = equipment.filter((item) => item.expiration_date && new Date(item.expiration_date) >= now && new Date(item.expiration_date) <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30)).length

  const totalInspections = inspections.length
  const insMonth = inspections.filter((item) => item.performed_at && new Date(item.performed_at) >= currentMonthStart).length
  const insQuarter = inspections.filter((item) => item.performed_at && new Date(item.performed_at) >= currentQuarterStart).length
  const insYear = inspections.filter((item) => item.performed_at && new Date(item.performed_at) >= currentYearStart).length

  const approvedCount = inspections.filter((item) => item.result === 'approved').length
  const approvedRestrictionCount = inspections.filter((item) => item.result === 'approved_with_restriction').length
  const rejectedCount = inspections.filter((item) => item.result === 'rejected' || item.verdict === 'unfit').length

  const resultBreakdown = [
    { label: 'APTO', count: approvedCount, percent: calculatePercent(approvedCount, totalInspections) },
    { label: 'AV', count: approvedRestrictionCount, percent: calculatePercent(approvedRestrictionCount, totalInspections) },
    { label: 'AR', count: rejectionReasons.filter((item) => item.classification === 'AR').length, percent: calculatePercent(rejectionReasons.filter((item) => item.classification === 'AR').length, rejectionReasons.length) },
    { label: 'REPROVADO', count: rejectedCount, percent: calculatePercent(rejectedCount, totalInspections) },
  ]

  const equipmentByCategory = categories
    .map((category) => ({
      name: category.name,
      count: equipment.filter((item) => item.category?.name === category.name).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

  const equipmentByManufacturer = manufacturers
    .map((manufacturer) => ({
      name: manufacturer.name,
      count: equipment.filter((item) => item.manufacturer?.name === manufacturer.name).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

  const clientsByEquipment = clients
    .map((client) => ({
      name: client.name,
      count: equipment.filter((item) => item.client?.name === client.name).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

  const clientRisk = clients
    .map((client) => {
      const clientEquipment = equipment.filter((item) => item.client?.name === client.name)
      const expired = clientEquipment.filter((item) => item.expiration_date && new Date(item.expiration_date) < now).length
      const rejected = inspections.filter((inspection) => inspection.equipment?.client?.name === client.name && (inspection.result === 'rejected' || inspection.verdict === 'unfit')).length
      const quarantine = clientEquipment.filter((item) => item.status === 'quarantine').length
      return {
        name: client.name,
        equipment_count: clientEquipment.length,
        expired,
        rejected,
        quarantine,
        score: Math.max(0, 100 - expired * 5 - rejected * 3 - quarantine * 2),
      }
    })
    .filter((item) => item.equipment_count > 0)
    .sort((a, b) => (b.expired + b.rejected + b.quarantine) - (a.expired + a.rejected + a.quarantine))

  const topRejectedEquipment = Object.entries(
    inspections
      .filter((inspection) => inspection.result === 'rejected' || inspection.verdict === 'unfit')
      .reduce<Record<string, number>>((accumulator, inspection) => {
        const key = inspection.equipment?.model ? inspection.equipment.model : `Equipamento ${inspection.equipment_id}`
        accumulator[key] = (accumulator[key] ?? 0) + 1
        return accumulator
      }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const reasonsByClassification = Object.entries(
    rejectionReasons.reduce<Record<string, number>>((accumulator, item) => {
      const key = item.classification || 'Sem classificação'
      accumulator[key] = (accumulator[key] ?? 0) + 1
      return accumulator
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const serviceSummary = services
    .map((service) => ({
      client: service.client?.name ?? 'FP Soluções',
      service: service.name || service.work_order || 'Serviço sem nome',
      count: equipment.filter((item) => item.client?.name === service.client?.name).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

  const quarantineSummary = {
    current_count: totalQuarantine,
    reasons: Object.entries(
      quarantineCases.reduce<Record<string, number>>((accumulator, item) => {
        const key = normalizeLabel(item.reason)
        accumulator[key] = (accumulator[key] ?? 0) + 1
        return accumulator
      }, {}),
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    average_days: quarantineCases.length
      ? Number(
          (
            quarantineCases.reduce((sum, item) => {
              const openedAt = item.opened_at ? new Date(item.opened_at).getTime() : 0
              const closedAt = item.closed_at ? new Date(item.closed_at).getTime() : Date.now()
              return sum + Math.max(0, (closedAt - openedAt) / (1000 * 60 * 60 * 24))
            }, 0) / quarantineCases.length
          ).toFixed(1),
        )
      : 0,
  }

  const maintenanceSummary = {
    sent: maintenanceRecords.length,
    recovered: maintenanceRecords.filter((item) => item.status === 'completed').length,
    recovery_rate: maintenanceRecords.length ? calculatePercent(maintenanceRecords.filter((item) => item.status === 'completed').length, maintenanceRecords.length) : 0,
  }

  const disposalSummary = {
    total: disposalRecords.length,
    reasons: Object.entries(
      disposalRecords.reduce<Record<string, number>>((accumulator, item) => {
        const key = normalizeLabel(item.reason)
        accumulator[key] = (accumulator[key] ?? 0) + 1
        return accumulator
      }, {}),
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }

  const currentYearMonthlyCounts = buildMonthSeries().map((period) => {
    const currentCount = inspections.filter((item) => item.performed_at && item.performed_at.startsWith(period.key)).length
    return { ...period, count: currentCount }
  })

  const feedingTrainingBuckets = {
    valid: trainingRecords.filter((item) => item.status === 'valid').length,
    expired: trainingRecords.filter((item) => item.status === 'expired').length,
    expiring_30: trainingRecords.filter((item) => item.status === 'expiring_soon' || (item.expires_at && new Date(item.expires_at) <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30))).length,
    expiring_60: trainingRecords.filter((item) => item.expires_at && new Date(item.expires_at) > new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30) && new Date(item.expires_at) <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60)).length,
    expiring_90: trainingRecords.filter((item) => item.expires_at && new Date(item.expires_at) > new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60) && new Date(item.expires_at) <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90)).length,
  }

  const trainingRate = trainingRecords.length ? calculatePercent(feedingTrainingBuckets.valid, trainingRecords.length) : 0
  const complianceRate = totalActive ? calculatePercent(totalActive, totalActive) : 0

  const inventoryHealthScore = calculateHealthScore(expiredCount, rejectedCount, expiringSoonCount)

  const fpIndex = Number(
    (
      (complianceRate || 0) * 0.4 +
      (trainingRate || 0) * 0.2 +
      calculatePercent(approvedCount, totalInspections) * 0.2 +
      ((1 - calculatePercent(totalQuarantine, totalEquipment || 1)) * 100 || 0) * 0.1 +
      ((1 - calculatePercent(expiredCount, totalEquipment || 1)) * 100 || 0) * 0.1
    ).toFixed(2),
  )

  return {
    equipment: {
      ...equipmentSummaryData,
      total_active: totalActive,
      total_operational: totalActive,
      total_blocked: totalBlocked,
      total_quarantine: totalQuarantine,
      total_retired: totalRetired,
      total_lost: totalLost,
      total_expired: expiredCount,
      total_expiring_soon: expiringSoonCount,
      total_fp: totalFp,
      total_client: totalClientsInventory,
      total_general: totalEquipment,
      compliance_percent: complianceRate,
      total_clients_active: clients.filter((client) => client.status !== 'inactive').length,
    },
    compliance: {
      ...complianceSummaryData,
      compliance_percent: complianceRate,
      approved: approvedCount,
      approved_with_restriction: approvedRestrictionCount,
      rejected: rejectedCount,
      total_inspections: totalInspections,
    },
    training: {
      ...trainingSummaryData,
      valid_count: feedingTrainingBuckets.valid,
      expired_count: feedingTrainingBuckets.expired,
      expiring_soon_count: feedingTrainingBuckets.expiring_30,
      expiring_60_count: feedingTrainingBuckets.expiring_60,
      expiring_90_count: feedingTrainingBuckets.expiring_90,
    },
    operations: {
      ...operationsSummaryData,
      total_clients: clients.filter((client) => client.status !== 'inactive').length,
      active_contracts: operationsSummaryData?.active_contracts ?? 0,
      equipment_under_management: totalEquipment,
    },
    executive: {
      fp_index: fpIndex,
      inventory_health_score: inventoryHealthScore,
      inventory_consolidated: {
        fp: totalFp,
        clients: totalClientsInventory,
        total: totalEquipment,
      },
      operational_status: {
        operational: totalActive,
        quarantine: totalQuarantine,
        blocked: totalBlocked,
        discarded: totalRetired + totalLost,
      },
    },
    inspections: {
      total: totalInspections,
      current_month: insMonth,
      current_quarter: insQuarter,
      current_year: insYear,
    },
    results: {
      apto: approvedCount,
      av: approvedRestrictionCount,
      ar: rejectionReasons.filter((item) => item.classification === 'AR').length,
      reprovado: rejectedCount,
      breakdown: resultBreakdown,
    },
    top_rejected_equipment: topRejectedEquipment,
    rejection_reasons: reasonsByClassification,
    clients_by_equipment: clientsByEquipment,
    client_risk: clientRisk,
    equipment_by_category: equipmentByCategory,
    equipment_by_manufacturer: equipmentByManufacturer,
    equipment_by_service: serviceSummary,
    quarantine: quarantineSummary,
    maintenance: maintenanceSummary,
    disposal: disposalSummary,
    productivity: currentYearMonthlyCounts,
    audit_events: auditEvents,
    training_rows: trainingRecords,
    inventory_rows: equipment,
    inspection_rows: inspections,
    expired_rows: equipment.filter((item) => item.expiration_date && new Date(item.expiration_date) < now),
    quarantine_rows: quarantineCases,
    training_export_rows: trainingRecords,
    clients_export_rows: clients,
    audit_export_rows: auditEvents,
    fp_index: fpIndex,
    inventory_health_score: inventoryHealthScore,
  }
}
