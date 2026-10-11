import type { EntityKey } from './types'

type ColType = 'text' | 'num' | 'bool'
export interface TableDef {
  table: string
  /** column name -> type. `id` is always the TEXT primary key. */
  cols: Record<string, ColType>
  /** column -> [referenced table, on delete action] */
  fks?: Record<string, [string, 'CASCADE' | 'SET NULL']>
  required: string[]
}

const t = 'text' as const, n = 'num' as const, b = 'bool' as const

// Order matters: parents before children.
export const SCHEMA: Record<EntityKey, TableDef> = {
  companies: {
    table: 'companies',
    cols: { name: t, industry: t, location: t, website: t, type: t, priority: t, status: t, description: t, size: t, linkedin: t, interests: t, notes: t, archived: b, createdAt: t },
    required: ['name'],
  },
  attempts: {
    table: 'attempts',
    cols: { companyId: t, method: t, emailKind: t, contact: t, role: t, personName: t, date: t, response: t, reply: t, progress: t, createdAt: t },
    fks: { companyId: ['companies', 'CASCADE'] },
    required: ['companyId', 'method'],
  },
  contacts: {
    table: 'contacts',
    cols: { companyId: t, name: t, position: t, email: t, phone: t, linkedin: t, type: t, notes: t, createdAt: t },
    fks: { companyId: ['companies', 'CASCADE'] },
    required: ['name', 'companyId'],
  },
  applications: {
    table: 'applications',
    cols: {
      companyId: t, position: t, department: t, jobUrl: t, location: t, workType: t, employmentType: t,
      applicationDate: t, deadline: t, source: t, salaryMin: n, salaryMax: n, currency: t, currentSalary: n,
      expectedSalary: n, recruiter: t, recruiterEmail: t, recruiterPhone: t, status: t, priority: t, notes: t,
      offerAmount: n, createdAt: t,
    },
    fks: { companyId: ['companies', 'CASCADE'] },
    required: ['companyId', 'position'],
  },
  interviews: {
    table: 'interviews',
    cols: { applicationId: t, type: t, date: t, time: t, location: t, interviewer: t, status: t, prepNotes: t, postNotes: t, result: t, createdAt: t },
    fks: { applicationId: ['applications', 'CASCADE'] },
    required: ['applicationId', 'date'],
  },
  followUps: {
    table: 'follow_ups',
    cols: { companyId: t, applicationId: t, contactId: t, dueDate: t, type: t, status: t, notes: t, completedAt: t, createdAt: t },
    fks: { companyId: ['companies', 'CASCADE'], applicationId: ['applications', 'CASCADE'], contactId: ['contacts', 'SET NULL'] },
    required: ['dueDate'],
  },
  activities: {
    table: 'activities',
    cols: { companyId: t, applicationId: t, contactId: t, type: t, date: t, description: t, notes: t, fromStage: t, toStage: t, createdAt: t },
    fks: { companyId: ['companies', 'CASCADE'], applicationId: ['applications', 'CASCADE'], contactId: ['contacts', 'SET NULL'] },
    required: ['type', 'date'],
  },
  attachments: {
    table: 'attachments',
    cols: { activityId: t, applicationId: t, companyId: t, name: t, mime: t, size: n, createdAt: t },
    fks: { activityId: ['activities', 'CASCADE'], applicationId: ['applications', 'CASCADE'], companyId: ['companies', 'CASCADE'] },
    required: ['name'],
  },
}
export const ENTITY_KEYS = Object.keys(SCHEMA) as EntityKey[]
