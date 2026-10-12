// English dictionary. Arabic (ar.ts) must define exactly the same keys (enforced by `npm test`).
export const en = {
  appName: "Fit-Out CRM",
  appTagline: "Fit-out & execution",
  navDashboard: "Dashboard",
  navLeads: "Leads",
  navCompanies: "Companies",
  navPipeline: "Sales Pipeline",
  navProjects: "Projects & Opportunities",
  navFollowUps: "Follow-Ups & Activities",
  navCategories: "Categories & Services",
  navSources: "Lead Sources",
  navReports: "Reports & Analytics",
  navSettings: "Settings",

  // common
  save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", view: "View", duplicate: "Duplicate", confirm: "Confirm", apply: "Apply",
  search: "Search", select: "Select…", selectAll: "Select all", retry: "Retry", next: "Next", prev: "Previous", print: "Print / PDF",
  viewAll: "View all", saved: "Saved", deleted: "Deleted", name: "Name", nameEn: "Name (English)", nameAr: "Name (Arabic)", labelEn: "Label (English)", labelAr: "Label (Arabic)",
  color: "Color", notes: "Notes", description: "Description", status: "Status", demo: "Demo", today: "Today", overdue: "Overdue", upcoming: "Upcoming", history: "History",
  details: "Details", leaveEmpty: "Leave empty", noResults: "No results", showing: "{from}–{to} of {total}", rowsPerPage: "Rows per page", drag: "Drag", moveTo: "Move to stage",
  moveUp: "Move up", moveDown: "Move down", clearFilters: "Clear filters", clearSelection: "Clear selection", import: "Import", export: "Export", exportFiltered: "Export filtered",
  exportSelected: "Export selected", nothingToExport: "Nothing to export", reason: "Reason", group: "Group", primary: "Primary", makePrimary: "Make primary",
  signIn: "Sign in", signOut: "Sign out", password: "Password", signInSubtitle: "Sign in to your workspace", openApp: "Open the app", loginLocalMode: "Supabase is not configured, so the app runs in local browser-storage mode. No sign-in is needed.",
  loadFailed: "Could not load your data", loadFailedHint: "Check your Supabase URL/key and that the SQL migration in supabase/migrations has been run.",

  // storage / banners
  storageLocal: "Local browser storage", storageLocalHint: "Saved in this browser only. Not a server database.",
  storageSupabase: "Supabase database", storageSupabaseHint: "Saved in your Supabase Postgres database.",
  storageLocalLong: "Your data is saved in this browser (IndexedDB) and survives refresh and restart, but it is NOT in a server database: it is not shared across devices or people and is lost if you clear site data. Download a backup regularly, or connect Supabase (see README) for a real database.",
  storageSupabaseLong: "Your data is stored in your Supabase Postgres database, protected by Row Level Security and sign-in. Download backups regularly as an extra safety net.",
  localModeBanner: "Local mode: data is saved only in this browser (not in a server database). Download a backup regularly or connect Supabase.",
  backupNow: "Back up now", demoBanner: "You are looking at demo data (fictional Saudi companies) mixed with your records.", removeDemo: "Remove demo data",
  removeDemoConfirm: "This permanently deletes all demo companies, contacts, leads, projects and activities. Your own records are not touched.",
  loadDemo: "Load demo data", demoData: "Demo data", demoDataHelp: "Demo records are fictional, flagged with a Demo badge, and can be removed in one click without touching your real records.",
  reminderBanner: "{n} lead(s) have follow-ups due or overdue.",

  // dashboard
  dashboardSubtitle: "Live overview of your pipeline. Every number updates when records change.",
  kpiTotalClients: "Total Potential Clients", kpiNewLeads: "New Leads", kpiContacted: "Contacted Clients", kpiFollowUp: "Follow-Up Required", kpiMeetings: "Meetings Scheduled",
  kpiQuotations: "Quotations Submitted", kpiWon: "Projects Won", kpiLost: "Projects Lost", kpiPotentialValue: "Potential Project Value", kpiWonValue: "Won Contract Value",
  kpiNote: "Potential value counts open pipeline stages only; won value uses the final contract value when recorded.",
  chartLeadsByCategory: "Leads by business category", chartLeadsByStage: "Leads by pipeline stage", chartMonthly: "Monthly lead acquisition", chartWonLost: "Won vs. lost opportunities",
  chartRevenueByService: "Potential revenue by service category", chartSources: "Lead source performance", last12Months: "Last 12 months",
  revenueSplitNote: "A lead's value is split evenly across its categories", potentialRevenue: "Potential revenue", upcomingActivities: "Upcoming activities", recentLeads: "Recent leads",
  nothingScheduled: "Nothing scheduled", noLeadsYet: "No leads yet", won: "Won", lost: "Lost", leads: "Leads", conversionRate: "Conversion rate",

  // leads
  newLead: "New lead", editLead: "Edit lead", leadId: "Lead ID", company: "Company", companyName: "Company / client name", contactPerson: "Contact person", jobTitle: "Job title",
  phone: "Phone", whatsapp: "WhatsApp", email: "Email", website: "Website", linkedin: "LinkedIn", instagram: "Instagram", city: "City", clientType: "Client type",
  businessCategory: "Business category", requiredServices: "Required services", categories: "Categories", category: "Category", selectCategories: "Select categories & services…",
  projectName: "Project name", projectLocation: "Project location", estimatedValue: "Estimated value", expectedStart: "Expected start date", leadSource: "Lead source", priority: "Priority",
  stage: "Pipeline stage", lastContact: "Last contact", nextFollowUp: "Next follow-up", assignedTo: "Assigned to", dateCreated: "Date created", lastUpdated: "Last updated",
  sameAsPhone: "Same as phone", secCompanyContact: "Company & contact", secProject: "Project & services", secPipeline: "Pipeline & follow-up", customFields: "Custom fields",
  companyMatched: "Matches existing company “{name}” — the lead will be linked to it.", leadCreated: "Lead created", leadUpdated: "Lead updated", leadDuplicated: "Duplicated as {code}",
  searchLeads: "Search company, contact, phone, email…", leadsCount: "{n} of {total} leads", allCategories: "All categories", allIn: "All in {name}", allStages: "All stages", allPriorities: "All priorities",
  allSources: "All sources", allCities: "All cities", anyFollowUp: "Any follow-up", next7Days: "Next 7 days", noFollowUp: "No follow-up", followUpDate: "Follow-up date",
  selectedN: "{n} selected", changeStage: "Change stage", changePriority: "Change priority", changeAssignee: "Change assignee", changeSource: "Change source", bulkUpdate: "Bulk update",
  bulkUpdated: "Updated {n} leads", bulkClosedNote: "Leads moved to Won/Lost get a default outcome; edit each lead to record the final value and reason.",
  deleteLeads: "Delete {n} lead(s)?", deleteLeadsConfirm: "This permanently deletes {n} lead(s) and their activity history. This cannot be undone.",
  noMatchingLeads: "No leads match your filters", tryClearFilters: "Try clearing some filters.", noLeadsHint: "Add your first lead, or import a CSV/Excel file.",
  leadNotFound: "Lead not found", backToLeads: "Back to leads", projectAndPipeline: "Project & pipeline", call: "Call",
  outcomeWon: "Won — record outcome", outcomeLost: "Lost — record outcome", finalContractValue: "Final contract value", lossReason: "Loss reason", outcomeDate: "Outcome date", outcomeNotes: "Outcome notes",

  // import
  importLeads: "Import leads", importHint: "Upload a .csv or .xlsx file. Columns are matched by name (English or Arabic). You will see a preview before anything is saved.",
  chooseFile: "Choose file", downloadTemplate: "Download template", fileTooLarge: "File is larger than 10 MB", importEmpty: "The file has no data rows.",
  importNoCompanyColumn: "Could not find a Company column. Download the template to see the expected headers.", rowsReady: "{n} ready to import", rowsWithErrors: "{n} with errors (skipped)",
  skipDuplicates: "Skip {n} possible duplicate(s)", ignoredColumns: "Ignored columns", previewLimited: "Showing the first {n} rows", importN: "Import {n} lead(s)", importDone: "Imported {n} leads",

  // activities
  followUp: "Follow-up", followUpsSubtitle: "Today, overdue and upcoming work in one place.", scheduleActivity: "Schedule activity", logActivity: "Log activity", editActivity: "Edit activity",
  completeActivity: "Complete activity", activityType: "Activity type", dateTime: "Date & time", outcome: "Outcome", nextAction: "Next action", scheduleNext: "Schedule the next action",
  alreadyCompleted: "Already completed (log as done)", activitySaved: "Activity saved", activityCompleted: "Activity completed", markDone: "Mark done", lead: "Lead",
  outcomePlaceholder: "What happened? What was agreed?", todaysFollowUps: "Today", overdueFollowUps: "Overdue", upcomingFollowUps: "Upcoming", scheduledMeetings: "Meetings", siteVisits: "Site visits",
  callsWhatsApp: "Calls & WhatsApp", emailsSent: "Emails sent", quotationsAwaiting: "Quotations awaiting response", completed: "Completed", overdueAlert: "{n} overdue follow-up(s) need attention",
  nothingHere: "Nothing here", nothingTodayHint: "No follow-ups due today. Nice work.", waitingDays: "{n} day(s) waiting", logFollowUp: "Log follow-up",
  timeline: "Timeline", addNote: "Add note", addNotePlaceholder: "Write a note or interaction summary…", noActivities: "No activity yet", deleteActivity: "Delete activity?", deleteActivityConfirm: "This activity will be permanently removed.",

  // contacts & companies
  contacts: "Contacts", addContact: "Add contact", editContact: "Edit contact", noContacts: "No contacts yet", noCompanyLinked: "No company linked to this lead",
  deleteContact: "Delete contact?", deleteContactConfirm: "Delete {name}? This cannot be undone.", newCompany: "New company", editCompany: "Edit company", industry: "Industry", companySize: "Company size",
  operatingRegions: "Operating regions", relationshipStatus: "Relationship status", mainPhone: "Main phone", mainEmail: "Main email", companiesCount: "{n} companies", searchCompanies: "Search company, city, email…",
  allRelationships: "All relationships", allIndustries: "All industries", openPipeline: "Open pipeline", opportunities: "Opportunities", existingProjects: "Existing projects", previousInteractions: "Previous interactions",
  deleteCompany: "Delete company?", deleteCompanyConfirm: "Delete {name}? Its {contacts} contact(s) are removed; its {leads} lead(s) and projects are kept but unlinked.", companyNotFound: "Company not found",
  errDuplicateCompany: "A company named “{name}” already exists.",

  // projects
  newProject: "New project", editProject: "Edit project", projectType: "Project type", clientCompany: "Client company", relatedLead: "Related lead", scopeOfWork: "Scope of work", serviceCategories: "Service categories",
  estimatedBudget: "Estimated budget", quotationValue: "Quotation value", expectedProfit: "Expected gross profit", probability: "Probability of winning", weightedValue: "Weighted pipeline value",
  opportunityValue: "Opportunity value", projectStatus: "Project status", expectedAwardDate: "Expected award date", expectedCompletion: "Expected completion", allStatuses: "All statuses",
  projectsCount: "{n} projects", openOpportunities: "Open opportunities", weightedPipeline: "Weighted pipeline", weightedProfit: "Probability-weighted profit", relatedActivities: "Related activities",
  deleteProject: "Delete project?", deleteProjectConfirm: "Delete project “{name}”? This cannot be undone.", noProjects: "No projects yet",

  // pipeline
  pipelineSubtitle: "{n} open stages · {value} in play. Drag cards between stages.", dropHere: "Drop here", movedTo: "Moved to {stage}",

  // categories / sources / reports
  categoriesSubtitle: "Business categories and services used to classify leads, projects and companies. Fully editable.", sourcesSubtitle: "Where your leads come from and how each source performs.",
  leadsBySource: "Leads by source", sourceWinLoss: "Won vs. lost by source", sourceValue: "Pipeline and won value by source", sourceConversion: "Conversion rate by source",
  conversionNote: "Won ÷ (won + lost)", wonValue: "Won value", manageSources: "Manage lead sources",
  reportsSubtitle: "Filter, review and export performance reports.", dateFrom: "From (date created)", dateTo: "To", reportDateNote: "The date range filters leads by their creation date.",
  reportCsv: "Report CSV", reportXlsx: "Report Excel", exportReportLeadsCsv: "Export {n} leads (CSV)", exportReportLeadsXlsx: "Export leads (Excel)", repReportTitle: "Report", repResult: "Result",
  repAll: "All", repOpen: "Open", repTotalLeads: "Total leads", repWinRate: "Win rate (of all leads)", repEstimatedAll: "Estimated value (all)", repEstimatedWon: "Estimated value (won)",
  repActualWon: "Actual contract value (won)", repEstimatedLost: "Estimated value (lost)", repAvgDeal: "Average won deal", repWeighted: "Weighted project pipeline", repActivities: "Activities scheduled",
  repCompleted: "Activities completed", repCompletion: "Follow-up completion rate", repOnTime: "Completed on time", repOverdue: "Overdue activities", repGroup: "Group", repEstimated: "Estimated", repActual: "Actual",
  bySource: "By lead source", byCategory: "By business category", byStage: "By pipeline stage", byCity: "By city", byMonth: "By month created", estimatedVsActual: "Estimated vs. actual value",

  // settings
  settingsSubtitle: "Everything here is editable data — no code changes needed.", tabGeneral: "General", tabPipeline: "Pipeline stages", tabLists: "Dropdown lists", tabFields: "Custom fields",
  tabColumns: "Table & filters", tabData: "Data & backup", generalSettings: "General", language: "Language", currency: "Currency", currencyHint: "Display currency only — existing values are not converted.",
  reminders: "Follow-up reminders", remindersHelp: "Shows a banner in the app when follow-ups are due.", enableReminders: "Enable reminder banner", remindDaysBefore: "Remind me", onTheDay: "On the due day",
  daysBeforeN: "{n} day(s) before", showOverdueBadge: "Show overdue count on the sidebar", tableColumns: "Lead table columns", tableColumnsHelp: "Tick the columns to show and reorder them.",
  defaultFilters: "Default lead filters", defaultFiltersHelp: "Applied when you open the Leads page.", storage: "Storage", backupRestore: "Backup & restore", downloadBackup: "Download full backup (JSON)",
  restoreBackup: "Restore from backup", restore: "Restore", restoreConfirm: "Restoring REPLACES all current data with the contents of the backup file. Download a backup of the current data first if unsure.",
  backupDownloaded: "Backup downloaded", exportAllLeadsCsv: "All leads (CSV)", exportAllLeadsXlsx: "All leads (Excel)", dangerZone: "Danger zone",
  eraseAll: "Erase all data", eraseHelp: "Deletes every record and resets categories, stages and lists to the defaults.", eraseConfirm: "This permanently deletes ALL data, including your own records. Download a backup first. This cannot be undone.",

  addCategoryGroup: "Add category group", addService: "Add service", editCategory: "Edit category", noCategories: "No categories yet", noServicesYet: "No services in this group yet",
  deleteCategory: "Delete “{name}”?", deleteCategoryInUse: "This category (with its subcategories) is used by {n} record(s). Pick a replacement or leave them without a category.",
  deleteGroupAlso: "This also deletes {n} subcategory(ies) in this group.",
  addStage: "Add stage", editStage: "Edit stage", stagesHelp: "Stages appear in this order in the Kanban board and filters.", stageKind: "Stage type", stageKindHint: "Decides how leads are counted: open pipeline, won, lost or on hold.",
  kindOpen: "Open", kindWon: "Won", kindLost: "Lost", kindHold: "On hold", dashboardCard: "Dashboard card", dashboardCardHint: "Which dashboard KPI this stage feeds (renaming stages never breaks statistics).",
  defaultProbability: "Default win probability", deleteStage: "Delete stage “{name}”?", cannotDeleteLastStage: "You must keep at least one “{kind}” stage.",
  addItem: "Add item", editItem: "Edit item", listEmpty: "This list is empty", deleteItem: "Delete “{name}”?", itemProtected: "This item is used internally and cannot be deleted (rename it instead).",
  cannotDeleteLastItem: "Keep at least one item in this list.", dropdownLists: "Dropdown lists",
  listSource: "Lead sources", listPriority: "Priorities", listClientType: "Client types", listAssignee: "Assignees / team", listCompanySize: "Company sizes", listIndustry: "Industries",
  listRelationship: "Relationship statuses", listProjectType: "Project types", listProjectStatus: "Project statuses", listActivityType: "Activity types", listLossReason: "Loss reasons", listCity: "Cities",
  inUse: "in use: {n}", deleteInUseWarning: "{n} record(s) use this item. Choose what they should become — nothing is deleted silently.", reassignTo: "Reassign affected records to", deleteUnusedConfirm: "This item is not used anywhere. Delete it?",
  addField: "Add custom field", editField: "Edit custom field", customFieldsHelp: "Extra fields that appear on every lead form, detail page and export.", noCustomFields: "No custom fields yet",
  fieldType: "Field type", requiredField: "Required", fieldOptions: "Options", fieldOptionsHint: "One option per line.", deleteField: "Delete field “{name}”?",
  deleteFieldInUse: "{n} lead(s) have a value in this field. Deleting the field permanently removes those values. Download a backup first if unsure.",
  errTypeChangeInUse: "Cannot change the type: {n} lead(s) already have values. Create a new field instead.", errOptionInUse: "These options are in use and cannot be removed: {list}",
  errOptionsRequired: "Add at least one option", typeLockedHint: "Type is locked because {n} lead(s) have values.",
  type_text: "Text", type_number: "Number", type_date: "Date", type_dropdown: "Dropdown", type_multiselect: "Multi-select", type_url: "URL", type_email: "Email", type_phone: "Phone number",

  // validation
  errRequired: "This field is required", errEmail: "Enter a valid email address", errUrl: "Enter a valid web address", errPhone: "Enter a valid phone number, e.g. +966 5X XXX XXXX",
  errNumber: "Enter a valid number (0 or more)", errDate: "Enter a valid date", errOption: "Choose a valid option", errTooLong: "Too long", errDuplicateName: "An item with this name already exists",
  errProbability: "Enter a number from 0 to 100", errEndBeforeStart: "Completion date is before the start date", errFollowBeforeContact: "Follow-up date is before the last contact date",
} as const;
