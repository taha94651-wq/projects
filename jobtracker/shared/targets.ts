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
  ['Havelock One', 'Unclassified'],
  ['Amaze Al Arabia', 'Unclassified'],
  ['Omrania', 'Design', 'عمرانية'],
  ['AECOM Riyadh', 'Design', 'AECOM الرياض', 'Riyadh, KSA'],
  ['Parsons', 'Unclassified'],
  ['INC KSA', 'Unclassified'],
  ['Creative Sketches', 'Design'],
  ['Feizo Design', 'Design'],
  ['Sammour Design', 'Design'],
  ['Trillion Style', 'Unclassified'],
  ['United Designers Co', 'Design'],
  ['Pink Line Interiors', 'Design'],
  ['Vera Interior', 'Design', 'فيرا'],
  ['Abdullah AlZeer + Partners', 'Design'],
  ['Diyar Design', 'Design'],
  ['ROSHN', 'Developer', 'روشن'],
  ['دار الأركان', 'Developer'],
  ['رتال', 'Developer'],
  ['رافال', 'Developer'],
  ['شركة الدرعية', 'Developer', 'Diriyah Company'],
]

export function buildTargetCompanies(now = new Date().toISOString()): Company[] {
  return T.map(([name, type, notes, location], i) => ({
    id: `co_target_${i + 1}`, name, type, industry: '', location: location ?? '', website: '', priority: 'Medium', status: 'Target',
    description: '', size: '', linkedin: '', interests: '', notes: notes ?? '', archived: false, createdAt: now,
  }))
}
export const TARGET_COUNT = T.length
