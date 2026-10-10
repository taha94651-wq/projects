import type { Company } from './types'
import type { CompanyType } from './constants'

/** The user's real list of offices / companies to apply to. Types are best-effort guesses and can be edited in the app. */
const T: [name: string, type: CompanyType, note?: string, location?: string][] = [
  ['مكتب غنيم', 'Other'],
  ['شركة سمو', 'Other'],
  ['بوثينة الحميدي', 'Other'],
  ['FBS', 'Other'],
  ['Simba Design', 'Interior Design', 'سيمبا'],
  ['أرجوان الشريف', 'Other'],
  ['ياسمين السديس', 'Other'],
  ['Citicore', 'Other', 'سيتي كور'],
  ['Harmony Co', 'Other', 'هارموني'],
  ['Malban', 'Other', 'ملبن'],
  ['أرجان المعمارية للتطوير العقاري', 'Developer'],
  ['دار العمران', 'Architecture', 'راسم بدران؟ (الاسم غير مؤكد)'],
  ['آرت ديكو ديزاين', 'Interior Design', 'نبيه عفارة'],
  ['Havelock One', 'Other'],
  ['Amaze Al Arabia', 'Other'],
  ['Omrania', 'Architecture', 'عمرانية'],
  ['AECOM Riyadh', 'Consultant', 'AECOM الرياض', 'Riyadh, KSA'],
  ['Parsons', 'Consultant'],
  ['INC KSA', 'Other'],
  ['Creative Sketches', 'Interior Design'],
  ['Feizo Design', 'Interior Design'],
  ['Sammour Design', 'Interior Design'],
  ['Trillion Style', 'Interior Design'],
  ['United Designers Co', 'Interior Design'],
  ['Pink Line Interiors', 'Interior Design'],
  ['Vera Interior', 'Interior Design', 'فيرا'],
  ['Abdullah AlZeer + Partners', 'Architecture'],
  ['Diyar Design', 'Interior Design'],
  ['ROSHN', 'Developer', 'روشن'],
  ['دار الأركان', 'Developer'],
  ['رتال', 'Developer'],
  ['رافال', 'Other'],
  ['شركة الدرعية', 'Developer', 'Diriyah Company'],
]

export function buildTargetCompanies(now = new Date().toISOString()): Company[] {
  return T.map(([name, type, notes, location], i) => ({
    id: `co_target_${i + 1}`, name, type, industry: '', location: location ?? '', website: '', priority: 'Medium', status: 'Target',
    description: '', size: '', linkedin: '', notes: notes ?? '', archived: false, createdAt: now,
  }))
}
export const TARGET_COUNT = T.length
