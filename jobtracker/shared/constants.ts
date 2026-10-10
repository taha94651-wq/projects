export const STAGES = [
  'Wishlist', 'Applied', 'HR Contact', 'Screening', 'Technical Interview',
  'Final Interview', 'Offer', 'Accepted', 'Rejected', 'Withdrawn',
] as const
export type Stage = (typeof STAGES)[number]
/** Stages that form the forward progress funnel (in order). */
export const FUNNEL: Stage[] = ['Applied', 'HR Contact', 'Screening', 'Technical Interview', 'Final Interview', 'Offer', 'Accepted']
export const CLOSED_STAGES: Stage[] = ['Accepted', 'Rejected', 'Withdrawn']
export const ACTIVE_STAGES: Stage[] = ['Applied', 'HR Contact', 'Screening', 'Technical Interview', 'Final Interview', 'Offer']

export const COMPANY_TYPES = ['Developer', 'Design & Execution', 'Unclassified'] as const
/** Project types a company works on / that you are interested in. Free to extend; stored as a comma-separated list. */
export const INTERESTS = ['Residential', 'Commercial', 'Mixed-use', 'Hospitality', 'Retail', 'Government / Giga-projects'] as const
/** How you tried to reach a company while searching for a way in. */
export const ATTEMPT_METHODS = ['Email', 'WhatsApp', 'Other'] as const
export const EMAIL_KINDS = ['HR email', 'Recruitment email'] as const
export const ATTEMPT_RESPONSES = ['Waiting', 'Replied', 'No reply', 'Wrong / bounced'] as const
export const COMPANY_STATUSES = ['Target', 'Contacted', 'Active', 'Interviewing', 'Offer', 'Closed'] as const
export const PRIORITIES = ['High', 'Medium', 'Low'] as const
export const WORK_TYPES = ['On-site', 'Hybrid', 'Remote'] as const
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance'] as const
export const SOURCES = ['LinkedIn', 'Company Website', 'Referral', 'Recruiter', 'Email', 'WhatsApp', 'Indeed', 'Bayt', 'Other'] as const
export const CURRENCIES = ['SAR', 'EGP', 'USD', 'AED', 'EUR'] as const
export const CONTACT_TYPES = ['HR', 'Recruiter', 'Hiring Manager', 'Director', 'Employee', 'Agency'] as const
export const INTERVIEW_TYPES = ['HR', 'Technical', 'Hiring Manager', 'Final', 'Portfolio Review', 'Site Interview'] as const
export const INTERVIEW_STATUSES = ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled', 'Passed', 'Failed'] as const
export const INTERVIEW_RESULTS = ['Pending', 'Passed', 'Failed', 'On hold'] as const
export const FOLLOWUP_TYPES = ['Email', 'WhatsApp', 'LinkedIn', 'Phone', 'Other'] as const
export const FOLLOWUP_STATUSES = ['Pending', 'Completed', 'Skipped'] as const
export const ACTIVITY_TYPES = [
  'Contacted', 'Applied', 'HR viewed CV', 'Interview', 'Follow-up', 'Email', 'Phone call',
  'WhatsApp', 'LinkedIn message', 'Stage change', 'Note', 'Offer', 'Other',
] as const
export const LOCALES = [
  { value: 'en-GB', label: 'English (UK) — 10/10/2026' },
  { value: 'en-US', label: 'English (US) — 10/10/2026' },
  { value: 'ar-EG', label: 'العربية (مصر)' },
  { value: 'ar-SA', label: 'العربية (السعودية)' },
] as const

export type CompanyType = (typeof COMPANY_TYPES)[number]
export type CompanyStatus = (typeof COMPANY_STATUSES)[number]
export type Priority = (typeof PRIORITIES)[number]
export type WorkType = (typeof WORK_TYPES)[number]
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]
export type Source = (typeof SOURCES)[number]
export type Currency = (typeof CURRENCIES)[number]
export type ContactType = (typeof CONTACT_TYPES)[number]
export type InterviewType = (typeof INTERVIEW_TYPES)[number]
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number]
export type InterviewResult = (typeof INTERVIEW_RESULTS)[number]
export type FollowUpType = (typeof FOLLOWUP_TYPES)[number]
export type FollowUpStatus = (typeof FOLLOWUP_STATUSES)[number]
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export type Interest = (typeof INTERESTS)[number]
export type AttemptMethod = (typeof ATTEMPT_METHODS)[number]
export type EmailKind = (typeof EMAIL_KINDS)[number]
export type AttemptResponse = (typeof ATTEMPT_RESPONSES)[number]
/** Old category names (pre-simplification) → new ones. Used to migrate stored data. */
export const LEGACY_TYPE_MAP: Record<string, (typeof COMPANY_TYPES)[number]> = {
  Architecture: 'Design & Execution', 'Interior Design': 'Design & Execution', Consultant: 'Design & Execution', 'Project Management': 'Design & Execution',
  'Retail Fit-out': 'Design & Execution', Contractor: 'Design & Execution', Joinery: 'Design & Execution', 'FF&E': 'Design & Execution',
  Design: 'Design & Execution', Execution: 'Design & Execution', Developer: 'Developer', Other: 'Unclassified',
}
