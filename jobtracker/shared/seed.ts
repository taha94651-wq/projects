import type { Activity, Application, Company, Contact, Dataset, FollowUp, Interview } from './types'
import { LEGACY_TYPE_MAP } from './constants'
import type { Currency, FollowUpType, InterviewResult, InterviewStatus, InterviewType, Priority, Source, Stage, WorkType, EmploymentType } from './constants'

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Builds a fictional, internally consistent dataset with dates relative to `today`. */
const DEMO_INTERESTS: Record<string, string> = {
  co_alnoor: 'Hospitality,Mixed-use,Government / Giga-projects', co_rds: 'Residential,Villas,Hospitality', co_gulfretail: 'Retail,Interior fit-out', co_urbanform: 'Government / Giga-projects,Commercial',
  co_axis: 'Commercial,Retail,Interior fit-out', co_modernspaces: 'Hospitality,Commercial', co_capital: 'Hospitality,Residential,Mixed-use', co_nile: 'Villas,Hospitality',
  co_meridian: 'Retail,Commercial', co_falcon: 'Residential,Mixed-use', co_horizon: 'Hospitality,Commercial', co_dune: 'Residential,Villas', co_talentbridge: '',
}

export function buildSeed(today = new Date()): Dataset {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const day = (offset: number) => { const d = new Date(base); d.setDate(d.getDate() + offset); return iso(d) }
  const stamp = (offset: number) => `${day(offset)}T09:00:00.000Z`

  const mk = (id: string, name: string, legacyType: string, industry: string, location: string, priority: Priority, status: Company['status'], size: string, description: string, extra: Partial<Company> = {}): Company => ({
    id, name, type: LEGACY_TYPE_MAP[legacyType] ?? 'Unclassified', industry, location, priority, status, size, description, interests: DEMO_INTERESTS[id] ?? '',
    website: `https://www.${id.replace('co_', '')}.example.com`, linkedin: `https://www.linkedin.com/company/${id.replace('co_', '')}`,
    notes: '', archived: false, createdAt: stamp(-60), ...extra,
  })
  const companies: Company[] = [
    mk('co_alnoor', 'Al Noor Architecture', 'Architecture', 'Architecture & Urban Design', 'Riyadh, KSA', 'High', 'Interviewing', '50–200', 'Mid-size practice delivering mixed-use, hospitality and civic projects across the Kingdom.', { notes: 'Portfolio review expected in the final round. Bring the hospitality case studies.' }),
    mk('co_rds', 'Riyadh Design Studio', 'Interior Design', 'Interior Design', 'Riyadh, KSA', 'High', 'Active', '20–50', 'Boutique interior studio focused on luxury residential and F&B interiors.'),
    mk('co_gulfretail', 'Gulf Retail Concepts', 'Retail Fit-out', 'Retail Design & Fit-out', 'Dubai, UAE', 'High', 'Offer', '200–500', 'Regional retail design and fit-out house working with fashion and lifestyle brands.', { notes: 'Offer received — negotiating package and start date.' }),
    mk('co_urbanform', 'Urban Form Consultants', 'Consultant', 'Engineering & Project Consultancy', 'Riyadh, KSA', 'Medium', 'Active', '200–500', 'Design and project management consultancy for giga-project clients.'),
    mk('co_axis', 'Axis Fit-Out', 'Contractor', 'Fit-out Contracting', 'Jeddah, KSA', 'Medium', 'Closed', '200–500', 'Commercial fit-out contractor specialising in offices and retail.'),
    mk('co_modernspaces', 'Modern Spaces', 'Interior Design', 'Interior Architecture', 'Cairo, Egypt', 'Medium', 'Active', '20–50', 'Interior architecture studio with hospitality and workplace portfolio.'),
    mk('co_capital', 'Capital Design Group', 'Architecture', 'Architecture & Masterplanning', 'Dubai, UAE', 'High', 'Interviewing', '500+', 'International architecture group with a large hospitality and residential pipeline.'),
    mk('co_nile', 'Nile Joinery Works', 'Joinery', 'Bespoke Joinery', 'Cairo, Egypt', 'Low', 'Closed', '50–200', 'Bespoke joinery workshop producing high-end millwork for hotels and villas.'),
    mk('co_meridian', 'Meridian Project Management', 'Project Management', 'Project & Cost Management', 'Riyadh, KSA', 'High', 'Interviewing', '200–500', 'PMC firm managing retail, commercial and hospitality programmes.'),
    mk('co_falcon', 'Falcon Developments', 'Developer', 'Real Estate Development', 'Riyadh, KSA', 'Medium', 'Target', '500+', 'Master developer with in-house design management team.'),
    mk('co_horizon', 'Horizon FF&E Solutions', 'FF&E', 'FF&E Procurement', 'Dubai, UAE', 'Medium', 'Active', '50–200', 'FF&E specification and procurement for hotels and workplaces.'),
    mk('co_dune', 'Studio Dune', 'Architecture', 'Architecture', 'Cairo, Egypt', 'Low', 'Closed', '5–20', 'Small architecture studio with a residential focus.'),
    mk('co_talentbridge', 'Talent Bridge Recruitment', 'Other', 'Recruitment Agency', 'Dubai, UAE', 'Low', 'Contacted', '20–50', 'Recruitment agency covering design and construction roles in the GCC.'),
  ]

  const ct = (id: string, companyId: string, name: string, position: string, type: Contact['type'], notes = ''): Contact => ({
    id, companyId, name, position, type, notes,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${companyId.replace('co_', '')}.example.com`,
    phone: '', linkedin: '', createdAt: stamp(-50),
  })
  const contacts: Contact[] = [
    ct('ct_ahmed', 'co_alnoor', 'Ahmed Karim', 'HR Manager', 'HR', 'Prefers email. Responds within 2 days.'),
    ct('ct_layla', 'co_rds', 'Layla Mansour', 'Talent Acquisition', 'Recruiter'),
    ct('ct_omar', 'co_gulfretail', 'Omar Haddad', 'Studio Director', 'Hiring Manager', 'Led the final interview. Interested in my retail portfolio.'),
    ct('ct_sara', 'co_gulfretail', 'Sara Nasser', 'HR Business Partner', 'HR'),
    ct('ct_khalid', 'co_axis', 'Khalid Rahman', 'Operations Director', 'Director'),
    ct('ct_nour', 'co_modernspaces', 'Nour Adel', 'HR Coordinator', 'HR'),
    ct('ct_yousef', 'co_capital', 'Yousef Salem', 'Associate Director', 'Hiring Manager'),
    ct('ct_hana', 'co_meridian', 'Hana Fahmy', 'Senior Recruiter', 'Recruiter'),
    ct('ct_tariq', 'co_talentbridge', 'Tariq Aziz', 'Design & Construction Consultant', 'Agency', 'Sends roles across the GCC. WhatsApp is the fastest channel.'),
    ct('ct_rana', 'co_urbanform', 'Rana Youssef', 'Recruitment Lead', 'HR'),
  ]

  type Step = [Stage, number]
  interface AppDef {
    id: string; co: string; position: string; department: string; location: string; work: WorkType; emp?: EmploymentType; source: Source
    min: number; max: number; cur: Currency; priority: Priority; path: Step[]; recruiter?: string; contact?: string
    expected?: number; offer?: number; deadline?: string; notes?: string
  }
  const defs: AppDef[] = [
    { id: 'ap_alnoor', co: 'co_alnoor', position: 'Senior Architect', department: 'Design', location: 'Riyadh, KSA', work: 'Hybrid', source: 'LinkedIn', min: 18000, max: 24000, cur: 'SAR', priority: 'High', contact: 'ct_ahmed', expected: 22000, notes: 'Strong match — hospitality focus. Prepare the Jeddah hotel case study.', path: [['Applied', -20], ['HR Contact', -17], ['Screening', -12], ['Technical Interview', -5]] },
    { id: 'ap_rds', co: 'co_rds', position: 'Senior Interior Designer', department: 'Interiors', location: 'Riyadh, KSA', work: 'On-site', source: 'Company Website', min: 14000, max: 18000, cur: 'SAR', priority: 'High', contact: 'ct_layla', expected: 17000, path: [['Applied', -9], ['HR Contact', -6]] },
    { id: 'ap_gulf1', co: 'co_gulfretail', position: 'Retail Design Lead', department: 'Design', location: 'Dubai, UAE', work: 'Hybrid', source: 'Recruiter', min: 22000, max: 28000, cur: 'AED', priority: 'High', contact: 'ct_omar', recruiter: 'Sara Nasser', expected: 27000, offer: 26000, notes: 'Offer received. Negotiate relocation allowance and review period.', path: [['Applied', -35], ['HR Contact', -30], ['Screening', -26], ['Technical Interview', -18], ['Final Interview', -8], ['Offer', -2]] },
    { id: 'ap_urban', co: 'co_urbanform', position: 'Project Manager', department: 'Project Management', location: 'Riyadh, KSA', work: 'On-site', source: 'Indeed', min: 20000, max: 26000, cur: 'SAR', priority: 'Medium', contact: 'ct_rana', path: [['Applied', -14]] },
    { id: 'ap_axis', co: 'co_axis', position: 'Fit-out Project Manager', department: 'Projects', location: 'Jeddah, KSA', work: 'On-site', source: 'Referral', min: 22000, max: 30000, cur: 'SAR', priority: 'Medium', contact: 'ct_khalid', notes: 'Rejected after the technical round — wanted more contractor-side experience.', path: [['Applied', -28], ['HR Contact', -24], ['Screening', -20], ['Technical Interview', -14], ['Rejected', -10]] },
    { id: 'ap_modern1', co: 'co_modernspaces', position: 'Interior Architect', department: 'Design', location: 'Cairo, Egypt', work: 'Hybrid', source: 'Bayt', min: 45000, max: 60000, cur: 'EGP', priority: 'Medium', contact: 'ct_nour', path: [['Applied', -11], ['HR Contact', -8]] },
    { id: 'ap_capital1', co: 'co_capital', position: 'Architectural Designer', department: 'Design', location: 'Dubai, UAE', work: 'On-site', source: 'LinkedIn', min: 12000, max: 16000, cur: 'AED', priority: 'Medium', deadline: day(6), notes: 'Apply before the deadline. Tailor the CV to hospitality.', path: [['Wishlist', -3]] },
    { id: 'ap_nile', co: 'co_nile', position: 'Joinery Project Coordinator', department: 'Production', location: 'Cairo, Egypt', work: 'On-site', source: 'Email', min: 40000, max: 55000, cur: 'EGP', priority: 'Low', path: [['Applied', -45], ['Rejected', -30]] },
    { id: 'ap_meridian', co: 'co_meridian', position: 'Senior Project Manager – Retail', department: 'Programme Management', location: 'Riyadh, KSA', work: 'Hybrid', source: 'Recruiter', min: 25000, max: 32000, cur: 'SAR', priority: 'High', contact: 'ct_hana', recruiter: 'Hana Fahmy', expected: 30000, path: [['Applied', -16], ['HR Contact', -13], ['Screening', -9], ['Technical Interview', -3]] },
    { id: 'ap_falcon', co: 'co_falcon', position: 'Design Manager', department: 'Design Management', location: 'Riyadh, KSA', work: 'On-site', source: 'LinkedIn', min: 28000, max: 35000, cur: 'SAR', priority: 'Medium', deadline: day(12), path: [['Wishlist', -1]] },
    { id: 'ap_horizon', co: 'co_horizon', position: 'FF&E Specifier', department: 'FF&E', location: 'Dubai, UAE', work: 'Hybrid', source: 'Company Website', min: 14000, max: 18000, cur: 'AED', priority: 'Medium', path: [['Applied', -6]] },
    { id: 'ap_dune', co: 'co_dune', position: 'Architect', department: 'Design', location: 'Cairo, Egypt', work: 'Remote', source: 'Referral', min: 30000, max: 40000, cur: 'EGP', priority: 'Low', notes: 'Withdrew — salary below expectation.', path: [['Applied', -22], ['HR Contact', -18], ['Withdrawn', -10]] },
    { id: 'ap_capital2', co: 'co_capital', position: 'Senior Architect – Hospitality', department: 'Hospitality Studio', location: 'Dubai, UAE', work: 'Hybrid', source: 'Recruiter', min: 20000, max: 26000, cur: 'AED', priority: 'High', contact: 'ct_yousef', recruiter: 'Tariq Aziz', expected: 25000, path: [['Applied', -25], ['HR Contact', -21], ['Screening', -17], ['Technical Interview', -10], ['Final Interview', -4]] },
    { id: 'ap_modern0', co: 'co_modernspaces', position: 'Design Coordinator', department: 'Design', location: 'Cairo, Egypt', work: 'On-site', source: 'LinkedIn', min: 35000, max: 45000, cur: 'EGP', priority: 'Low', offer: 40000, notes: 'Declined the offer — compensation too low.', path: [['Applied', -80], ['HR Contact', -75], ['Technical Interview', -65], ['Offer', -55], ['Withdrawn', -50]] },
    { id: 'ap_horizon0', co: 'co_horizon', position: 'Freelance FF&E Consultant', department: 'FF&E', location: 'Dubai, UAE', work: 'Remote', emp: 'Freelance', source: 'WhatsApp', min: 8000, max: 12000, cur: 'AED', priority: 'Low', offer: 10000, path: [['Applied', -70], ['HR Contact', -66], ['Technical Interview', -60], ['Offer', -52], ['Accepted', -50]] },
  ]

  const applications: Application[] = defs.map(d => ({
    id: d.id, companyId: d.co, position: d.position, department: d.department, jobUrl: `https://jobs.example.com/${d.id.replace('ap_', '')}`,
    location: d.location, workType: d.work, employmentType: d.emp ?? 'Full-time',
    applicationDate: d.path[0][0] === 'Wishlist' ? '' : day(d.path[0][1]), deadline: d.deadline ?? '', source: d.source,
    salaryMin: d.min, salaryMax: d.max, currency: d.cur, currentSalary: null, expectedSalary: d.expected ?? null,
    recruiter: d.recruiter ?? '', recruiterEmail: d.recruiter ? `${d.recruiter.toLowerCase().replace(/[^a-z]+/g, '.')}@recruiter.example.com` : '', recruiterPhone: '',
    status: d.path[d.path.length - 1][0], priority: d.priority, notes: d.notes ?? '', offerAmount: d.offer ?? null,
    createdAt: stamp(d.path[0][1]),
  }))

  // Activities: one per stage transition.
  const activities: Activity[] = []
  let n = 0
  const act = (a: Partial<Activity> & Pick<Activity, 'type' | 'date'>): Activity => ({
    id: `ac_${++n}`, companyId: null, applicationId: null, contactId: null, description: '', notes: '', fromStage: '', toStage: '', createdAt: `${a.date}T09:00:00.000Z`, ...a,
  })
  const stageText: Record<string, string> = {
    Wishlist: 'Added to wishlist', Applied: 'Application submitted', 'HR Contact': 'HR / recruiter made contact', Screening: 'Moved to screening',
    'Technical Interview': 'Technical interview stage', 'Final Interview': 'Final interview stage', Offer: 'Offer received', Accepted: 'Offer accepted', Rejected: 'Application rejected', Withdrawn: 'Application withdrawn',
  }
  for (const d of defs) {
    d.path.forEach(([stage, off], i) => {
      activities.push(act({
        companyId: d.co, applicationId: d.id, contactId: stage === 'HR Contact' ? d.contact ?? null : null,
        type: stage === 'Applied' ? 'Applied' : stage === 'Offer' ? 'Offer' : 'Stage change', date: day(off), description: stageText[stage],
        fromStage: i === 0 ? '' : d.path[i - 1][0], toStage: stage,
      }))
    })
  }
  const extra: [string, string, string | null, Activity['type'], number, string, string?][] = [
    ['co_alnoor', 'ap_alnoor', 'ct_ahmed', 'Email', -17, 'HR emailed to arrange a first call', 'Asked for portfolio PDF under 20MB.'],
    ['co_alnoor', 'ap_alnoor', 'ct_ahmed', 'Phone call', -12, 'Screening call (25 min)', 'Discussed salary expectations and notice period.'],
    ['co_alnoor', 'ap_alnoor', null, 'Note', -4, 'Prepared portfolio for technical round'],
    ['co_gulfretail', 'ap_gulf1', 'ct_omar', 'Email', -2, 'Offer letter received by email', 'Base 26,000 AED + housing allowance.'],
    ['co_gulfretail', 'ap_gulf1', 'ct_sara', 'Phone call', -1, 'Call with HR to clarify offer terms'],
    ['co_rds', 'ap_rds', 'ct_layla', 'WhatsApp', -6, 'Recruiter reached out on WhatsApp'],
    ['co_rds', 'ap_rds', 'ct_layla', 'Email', -4, 'Sent updated CV and portfolio'],
    ['co_meridian', 'ap_meridian', 'ct_hana', 'LinkedIn message', -13, 'Recruiter messaged on LinkedIn'],
    ['co_meridian', 'ap_meridian', 'ct_hana', 'Phone call', -9, 'Screening call with recruiter'],
    ['co_capital', 'ap_capital2', 'ct_yousef', 'Email', -4, 'Thanked for the final interview'],
    ['co_modernspaces', 'ap_modern1', 'ct_nour', 'Email', -8, 'HR confirmed receipt of application'],
    ['co_talentbridge', null as unknown as string, 'ct_tariq', 'WhatsApp', -20, 'Agency shared three new GCC openings'],
    ['co_urbanform', 'ap_urban', 'ct_rana', 'Email', -12, 'Sent follow-up asking about status'],
    ['co_axis', 'ap_axis', 'ct_khalid', 'Email', -10, 'Rejection email received', 'Feedback: more contractor-side experience needed.'],
  ]
  for (const [co, ap, c, type, off, description, notes] of extra) {
    activities.push(act({ companyId: co, applicationId: ap || null, contactId: c, type, date: day(off), description, notes: notes ?? '' }))
  }

  const interviews: Interview[] = []
  const iv = (appId: string, type: InterviewType, off: number, time: string, status: InterviewStatus, result: InterviewResult, loc: string, who: string, prep = '', post = ''): void => {
    interviews.push({ id: `iv_${interviews.length + 1}`, applicationId: appId, type, date: day(off), time, status, result, location: loc, interviewer: who, prepNotes: prep, postNotes: post, createdAt: stamp(off - 3) })
    const app = defs.find(a => a.id === appId)!
    activities.push(act({ companyId: app.co, applicationId: appId, type: 'Interview', date: day(Math.min(off, 0)), description: `${type} interview ${status === 'Scheduled' ? 'scheduled' : 'completed'}` }))
  }
  iv('ap_alnoor', 'HR', -12, '11:00', 'Passed', 'Passed', 'Phone', 'Ahmed Karim', '', 'Positive. Moving to technical round.')
  iv('ap_alnoor', 'Technical', 2, '14:00', 'Scheduled', 'Pending', 'Al Noor HQ, Riyadh', 'Principal Architect', 'Review hospitality portfolio. Be ready for a Revit workflow discussion and a short design critique.')
  iv('ap_gulf1', 'HR', -26, '10:00', 'Passed', 'Passed', 'Zoom', 'Sara Nasser')
  iv('ap_gulf1', 'Technical', -18, '15:00', 'Passed', 'Passed', 'Zoom', 'Omar Haddad', '', 'Walked through two flagship store projects. Good rapport.')
  iv('ap_gulf1', 'Final', -8, '13:00', 'Passed', 'Passed', 'Dubai studio', 'Omar Haddad + MD', '', 'Offer expected within a week.')
  iv('ap_axis', 'HR', -20, '09:30', 'Passed', 'Passed', 'Phone', 'Khalid Rahman')
  iv('ap_axis', 'Technical', -14, '11:00', 'Failed', 'Failed', 'Jeddah office', 'Khalid Rahman', '', 'Questions on site coordination and subcontractor claims.')
  iv('ap_meridian', 'HR', -9, '12:00', 'Passed', 'Passed', 'Teams', 'Hana Fahmy')
  iv('ap_meridian', 'Technical', 0, '16:00', 'Scheduled', 'Pending', 'https://meet.example.com/meridian-tech', 'Programme Director', 'Review retail rollout programme example, cost control and risk register.')
  iv('ap_capital2', 'HR', -21, '10:00', 'Passed', 'Passed', 'Teams', 'Recruiter')
  iv('ap_capital2', 'Technical', -10, '14:30', 'Passed', 'Passed', 'Teams', 'Yousef Salem')
  iv('ap_capital2', 'Final', 1, '11:00', 'Scheduled', 'Pending', 'Capital Design Group, Dubai', 'Yousef Salem + Studio Head', 'Prepare a 15-minute portfolio presentation focused on hospitality.')
  iv('ap_modern0', 'Technical', -65, '12:00', 'Passed', 'Passed', 'Zoom', 'Design Lead')
  iv('ap_horizon0', 'Technical', -60, '12:00', 'Passed', 'Passed', 'Zoom', 'Procurement Manager')

  const followUps: FollowUp[] = []
  const fu = (appId: string, contact: string | null, off: number, type: FollowUpType, status: FollowUp['status'], notes = ''): void => {
    const app = defs.find(a => a.id === appId)!
    followUps.push({
      id: `fu_${followUps.length + 1}`, companyId: app.co, applicationId: appId, contactId: contact, dueDate: day(off), type, status, notes,
      completedAt: status === 'Completed' ? day(off) : '', createdAt: stamp(Math.min(off, 0) - 2),
    })
  }
  fu('ap_alnoor', 'ct_ahmed', 0, 'Email', 'Pending', 'Confirm interview logistics and send updated portfolio.')
  fu('ap_rds', 'ct_layla', -2, 'WhatsApp', 'Pending', 'Ask for an update on next steps.')
  fu('ap_gulf1', 'ct_sara', 3, 'Email', 'Pending', 'Reply with counter-offer on allowance.')
  fu('ap_urban', 'ct_rana', 1, 'LinkedIn', 'Pending', 'No response after 14 days — gentle nudge.')
  fu('ap_modern1', 'ct_nour', 4, 'Phone', 'Pending')
  fu('ap_horizon', null, -1, 'Email', 'Pending', 'Applied via website — no reply yet.')
  fu('ap_meridian', 'ct_hana', -3, 'Email', 'Completed', 'Sent thank-you after screening.')
  fu('ap_capital2', 'ct_yousef', -3, 'Email', 'Completed', 'Thank-you note after the technical round.')
  fu('ap_axis', 'ct_khalid', -8, 'Email', 'Skipped', 'Not needed after rejection.')
  fu('ap_alnoor', 'ct_ahmed', -10, 'Email', 'Completed', 'Sent portfolio before the screening call.')
  fu('ap_meridian', 'ct_hana', 5, 'Phone', 'Pending', 'Check outcome of technical round.')

  // Follow-up activities for completed ones
  for (const f of followUps.filter(x => x.status === 'Completed')) {
    activities.push(act({ companyId: f.companyId, applicationId: f.applicationId, contactId: f.contactId, type: 'Follow-up', date: f.dueDate, description: `Follow-up completed (${f.type})`, notes: f.notes }))
  }

  const att = (id: string, companyId: string, method: 'Email' | 'WhatsApp' | 'Other', contact: string, off: number, response: 'Waiting' | 'Replied' | 'No reply' | 'Wrong / bounced', emailKind: 'HR email' | 'Recruitment email' | '' = '', reply = '', progress = '') => ({ id, companyId, method, emailKind, contact, date: day(off), response, reply, progress, createdAt: stamp(off) })
  const attempts = [
    att('at_1', 'co_modernspaces', 'Email', 'careers@modernspaces.example.com', -14, 'No reply', 'Recruitment email', '', 'No answer after a week — trying the HR address next.'),
    att('at_2', 'co_modernspaces', 'Email', 'hr@modernspaces.example.com', -8, 'Replied', 'HR email', 'Thanks, please send your CV and portfolio.', 'Sent CV + portfolio. Waiting for an interview slot.'),
    att('at_3', 'co_falcon', 'WhatsApp', '+000 0000 0000', -3, 'Waiting', '', '', 'Sent a short intro and the CV.'),
  ]
  return { companies, attempts, contacts, applications, interviews, followUps, activities, attachments: [] }
}
