import type { Company } from './types'
import type { CompanyType } from './constants'

/**
 * The user's own list of offices / companies to apply to (no outside companies are ever added by the app).
 * Category is set only where the name makes it clear; the rest stay 'Unclassified' for the user to decide.
 */
const T: [name: string, type: CompanyType, note?: string, location?: string][] = [
  ['مكتب غنيم', 'Unclassified'],
  ['شركة سمو', 'Unclassified'],
  ['بوثينة الحميدي', 'Unclassified'],
  ['FBS', 'Unclassified'],
  ['Simba Design', 'Design', 'سيمبا'],
  ['أرجوان الشريف', 'Unclassified'],
  ['ياسمين السديس', 'Unclassified'],
  ['Citicore', 'Unclassified', 'سيتي كور'],
  ['Harmony Co', 'Unclassified', 'هارموني'],
  ['Malban', 'Unclassified', 'ملبن'],
  ['أرجان المعمارية للتطوير العقاري', 'Developer'],
  ['دار العمران', 'Design', 'راسم بدران؟ (الاسم غير مؤكد)'],
  ['آرت ديكو ديزاين', 'Design', 'نبيه عفارة'],
]

export function buildTargetCompanies(now = new Date().toISOString()): Company[] {
  return T.map(([name, type, notes, location], i) => ({
    id: `co_target_${i + 1}`, name, type, industry: '', location: location ?? '', website: '', priority: 'Medium', status: 'Target',
    description: '', size: '', linkedin: '', interests: '', notes: notes ?? '', archived: false, createdAt: now,
  }))
}
export const TARGET_COUNT = T.length
