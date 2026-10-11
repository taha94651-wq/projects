import type { Company } from './types'
import type { CompanyType } from './constants'

/**
 * The user's own list of offices / companies to apply to (no outside companies are ever added by the app).
 * Category is set only where the name makes it clear; the rest stay 'Unclassified' for the user to decide.
 */
const T: [name: string, type: CompanyType, note?: string, location?: string][] = [
  ['مكتب غنيم', 'Unclassified', 'بحثت على الإنترنت ولم أجد معلومات عنه'],
  ['شركة سمو', 'Developer', 'غالبًا سمو العقارية (مطوّر عقاري، مدرجة في تداول 4323) — تطابق الاسم غير مؤكد: https://www.mubasher.info/markets/TDWL/stocks/4323/news'],
  ['بوثينة الحميدي', 'Unclassified', 'بحثت على الإنترنت ولم أجد معلومات عنها'],
  ['FBS', 'Design & Execution', 'غالبًا Focal Buildings Solutions — استوديو تصميم داخلي وتصميم وتنفيذ وتأثيث في جدة والرياض (تطابق الاسم غير مؤكد): https://themedialine.org/mideast-streets/design-talk/print/', 'Jeddah, KSA'],
  ['Simba Design', 'Design & Execution', 'سيمبا — غالبًا Simba Home: فريق ديكور وتصميم داخلي وتأثيث في السعودية (تطابق الاسم غير مؤكد): https://domkapa.com/?p=26602'],
  ['أرجوان الشريف', 'Design & Execution', 'Arjwan Al-Sharif — مهندسة ومصممة سعودية (مقابلة في سيدتي): https://www.sayidaty.net/node/1834505'],
  ['ياسمين السديس', 'Unclassified', 'بحثت على الإنترنت ولم أجد معلومات عنها'],
  ['Citicore', 'Unclassified', 'سيتي كور — بحثت على الإنترنت ولم أجد شركة بهذا الاسم في السعودية'],
  ['Harmony Co', 'Unclassified', 'هارموني — بحثت على الإنترنت ولم أجد شركة بهذا الاسم'],
  ['Malban', 'Unclassified', 'ملبن — بحثت على الإنترنت ولم أجد شركة بهذا الاسم'],
  ['أرجان المعمارية للتطوير العقاري', 'Developer', 'التصنيف من الاسم (تطوير عقاري). لم أجد شركة بنفس الاسم بالضبط على الإنترنت'],
  ['دار العمران', 'Design & Execution', 'راسم بدران؟ (الاسم غير مؤكد). مدرج في دليل مكاتب هندسية بالرياض (حي السلمانية) — لم أتحقق من مصدر رسمي'],
  ['آرت ديكو ديزاين', 'Design & Execution', 'نبيه عفارة — استوديو تصميم داخلي فاخر في السعودية (جائزة أفضل استوديو 2021): https://design-middleeast.com/art-deco-design-best-luxury-interior-design-studio-in-saudi-arabia/'],
]

export function buildTargetCompanies(now = new Date().toISOString()): Company[] {
  return T.map(([name, type, notes, location], i) => ({
    id: `co_target_${i + 1}`, name, type, industry: '', location: location ?? '', website: '', priority: 'Medium', status: 'Target',
    description: '', size: '', linkedin: '', interests: '', notes: notes ?? '', archived: false, createdAt: now,
  }))
}
export const TARGET_COUNT = T.length
