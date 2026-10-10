import type * as C from './constants'

/** Dates are ISO strings: `YYYY-MM-DD` (date only) — times are `HH:mm`. */
export interface Company {
  id: string
  name: string
  industry: string
  location: string
  website: string
  type: C.CompanyType
  priority: C.Priority
  status: C.CompanyStatus
  description: string
  size: string
  linkedin: string
  interests: string
  notes: string
  archived: boolean
  createdAt: string
}
/** One try at finding / reaching a company: an email (HR or recruitment), a WhatsApp number, or something else. */
export interface Attempt {
  id: string
  companyId: string
  method: C.AttemptMethod
  /** Only for emails: whether it is an HR address or a recruitment / careers address. */
  emailKind: C.EmailKind | ''
  /** The email address, the WhatsApp number, or a short description for "Other". */
  contact: string
  date: string
  response: C.AttemptResponse
  /** What they replied. */
  reply: string
  /** Where you got with this attempt. */
  progress: string
  createdAt: string
}
export interface Contact {
  id: string
  companyId: string
  name: string
  position: string
  email: string
  phone: string
  linkedin: string
  type: C.ContactType
  notes: string
  createdAt: string
}
export interface Application {
  id: string
  companyId: string
  position: string
  department: string
  jobUrl: string
  location: string
  workType: C.WorkType
  employmentType: C.EmploymentType
  applicationDate: string
  deadline: string
  source: C.Source
  salaryMin: number | null
  salaryMax: number | null
  currency: C.Currency
  currentSalary: number | null
  expectedSalary: number | null
  recruiter: string
  recruiterEmail: string
  recruiterPhone: string
  status: C.Stage
  priority: C.Priority
  notes: string
  offerAmount: number | null
  createdAt: string
}
export interface Interview {
  id: string
  applicationId: string
  type: C.InterviewType
  date: string
  time: string
  location: string
  interviewer: string
  status: C.InterviewStatus
  prepNotes: string
  postNotes: string
  result: C.InterviewResult
  createdAt: string
}
export interface FollowUp {
  id: string
  companyId: string | null
  applicationId: string | null
  contactId: string | null
  dueDate: string
  type: C.FollowUpType
  status: C.FollowUpStatus
  notes: string
  completedAt: string
  createdAt: string
}
export interface Activity {
  id: string
  companyId: string | null
  applicationId: string | null
  contactId: string | null
  type: C.ActivityType
  date: string
  description: string
  notes: string
  fromStage: string
  toStage: string
  createdAt: string
}
export interface Attachment {
  id: string
  activityId: string | null
  applicationId: string | null
  companyId: string | null
  name: string
  mime: string
  size: number
  createdAt: string
}
export interface Settings {
  lang: 'en' | 'ar'
  locale: string
  defaultCurrency: C.Currency
  staleDays: number
}
export interface User {
  id: string
  name: string
  email: string
}

export interface Dataset {
  companies: Company[]
  attempts: Attempt[]
  contacts: Contact[]
  applications: Application[]
  interviews: Interview[]
  followUps: FollowUp[]
  activities: Activity[]
  attachments: Attachment[]
}
export type EntityKey = keyof Dataset
