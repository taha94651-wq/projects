/**
 * Ready-to-send messages. They are written for the recipient, so they are independent of the UI language:
 * each exists in English and Arabic (first-person phrasing kept gender-neutral).
 */
export type DraftKind = 'followup' | 'thankyou' | 'feedback' | 'first' | 'second' | 'reply' | 'negotiate'
export type DraftLang = 'en' | 'ar'
export interface DraftVars { company: string; position?: string; name?: string; me?: string; date?: string; type?: string; offer?: string }

const T: Record<DraftKind, Record<DraftLang, string>> = {
  followup: {
    en: 'Hello {name},\n\nI applied for the {position} role at {company} on {date} and wanted to check whether you have had a chance to review my application. I am very interested in joining {company} and would be glad to share anything else you need (CV, portfolio).\n\nThank you for your time.\nBest regards,\n{me}',
    ar: 'السلام عليكم {name}،\n\nتقدمت لوظيفة {position} في {company} بتاريخ {date}، وأحببت أن أطمئن إن كان قد تم الاطلاع على طلبي. اهتمامي كبير بالانضمام إلى {company}، ويسعدني تزويدكم بأي مستندات إضافية (السيرة الذاتية، ملف الأعمال).\n\nشاكر لكم وقتكم.\nتحياتي،\n{me}',
  },
  thankyou: {
    en: 'Hello {name},\n\nThank you for taking the time to speak with me about the {position} role at {company}. I enjoyed the {type} conversation and it confirmed my interest in the position. Please let me know if I can send anything else to support my application.\n\nBest regards,\n{me}',
    ar: 'السلام عليكم {name}،\n\nأشكركم على الوقت الذي خصصتموه للحديث معي حول وظيفة {position} في {company}. استفدت كثيرًا من المقابلة ({type})، وزادت رغبتي في الانضمام. وأرجو إبلاغي إن كان بالإمكان تزويدكم بأي مستندات تدعم طلبي.\n\nتحياتي،\n{me}',
  },
  feedback: {
    en: 'Hello {name},\n\nI hope you are well. I wanted to follow up on my {type} interview for the {position} role at {company}. Could you share any update on the next steps or the expected timeline? I remain very interested in the opportunity.\n\nThank you,\n{me}',
    ar: 'السلام عليكم {name}،\n\nأرجو أن تكونوا بخير. أتواصل معكم بخصوص مقابلة ({type}) لوظيفة {position} في {company}، وأود معرفة أي مستجدات حول الخطوات القادمة أو الإطار الزمني المتوقع. ما زال اهتمامي بالفرصة كبيرًا.\n\nشاكر لكم،\n{me}',
  },
  first: {
    en: 'Hello {name},\n\nMy name is {me}. I am an architect/designer interested in opportunities at {company}. I have attached my CV and portfolio, and I would be grateful if you could tell me who I should speak to about open roles or direct my application to the right person.\n\nThank you for your time.\nBest regards,\n{me}',
    ar: 'السلام عليكم {name}،\n\nأنا {me}، مهتم بفرص العمل في {company}. أرفقت سيرتي الذاتية وملف أعمالي، وأرجو إرشادي إلى الشخص المناسب للتواصل بشأن الوظائف المتاحة أو توجيه طلبي إلى الجهة المختصة.\n\nشاكر لكم وقتكم.\nتحياتي،\n{me}',
  },
  second: {
    en: 'Hello {name},\n\nI wrote to {company} earlier about opportunities there and wanted to follow up in case my message was missed. I would be glad to send my CV and portfolio again, or to speak briefly whenever suits you.\n\nThank you,\n{me}',
    ar: 'السلام عليكم {name}،\n\nسبق أن راسلت {company} بخصوص فرص العمل لديكم، وأحببت المتابعة تحسبًا لعدم وصول رسالتي. يسعدني إعادة إرسال سيرتي الذاتية وملف أعمالي، أو التحدث معكم لدقائق في الوقت المناسب لكم.\n\nشاكر لكم،\n{me}',
  },
  reply: {
    en: 'Hello {name},\n\nThank you for your reply. As requested, I am attaching my CV and portfolio for the {position} role. I would be happy to discuss my experience whenever convenient for you.\n\nBest regards,\n{me}',
    ar: 'السلام عليكم {name}،\n\nأشكركم على ردكم. وكما طلبتم، أرفقت سيرتي الذاتية وملف أعمالي لوظيفة {position}. يسعدني مناقشة خبراتي في الوقت الذي يناسبكم.\n\nتحياتي،\n{me}',
  },
  negotiate: {
    en: 'Hello {name},\n\nThank you very much for the offer ({offer}) for the {position} role at {company}. I am excited about the opportunity. Based on my experience and the scope of the role, I was hoping to discuss the compensation package. Would you be open to a conversation about this?\n\nBest regards,\n{me}',
    ar: 'السلام عليكم {name}،\n\nأشكركم جزيل الشكر على العرض ({offer}) لوظيفة {position} في {company}، وأنا متحمس للفرصة. وبناءً على خبرتي ونطاق الدور، آمل مناقشة حزمة التعويضات. هل يمكن ترتيب حديث بهذا الشأن؟\n\nتحياتي،\n{me}',
  },
}

export function draftText(kind: DraftKind, vars: DraftVars, lang: DraftLang): string {
  const fallbackName = lang === 'ar' ? 'فريق التوظيف' : 'Hiring Team'
  const v: Record<string, string> = { name: fallbackName, position: '', me: '', date: '', type: '', offer: '', ...Object.fromEntries(Object.entries(vars).filter(([, x]) => x)) }
  return T[kind][lang].replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '')
}
/** Arabic-script company names get an Arabic draft by default. */
export const defaultDraftLang = (company: string): DraftLang => (/[؀-ۿ]/.test(company) ? 'ar' : 'en')
