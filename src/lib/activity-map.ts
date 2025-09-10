// lib/activity-map.ts
export type Activity = {
  category: string
  action: string
  icon?: string                // lucide-react icon name (string key below)
  severity?: 'info' | 'success' | 'warning' | 'danger'
}

type Rule = { pattern: RegExp; activity: Activity }

/** Icon name → Lucide icon key (kept as strings; see Icon component below). */
export const ACTIVITY_RULES: Rule[] = [
  /** ---------- Auth & Session ---------- */
  { pattern: /^\/user\/check$/i,
    activity: { category: 'Auth & Session', action: 'Login & fetch charity access', icon: 'LogIn', severity: 'info' } },
  // Heuristic: many backends log the same path for send & verify; we still split for nicer labels.
  { pattern: /^\/user\/auth1\/?$/i,
    activity: { category: 'Auth & Session', action: 'Send 2FA code', icon: 'KeyRound', severity: 'info' } },   // POST
  { pattern: /^\/user\/auth1\/$/i,
    activity: { category: 'Auth & Session', action: 'Verify 2FA code', icon: 'ShieldCheck', severity: 'success' } }, // PUT

  /** ---------- User Management ---------- */
  { pattern: /^\/user\/create$/i,
    activity: { category: 'User Management', action: 'Create user', icon: 'UserPlus', severity: 'success' } },
  { pattern: /^\/user\/([0-9a-f-]+)$/i,
    activity: { category: 'User Management', action: 'View user', icon: 'User', severity: 'info' } },
  { pattern: /^\/user\/list$/i,
    activity: { category: 'User Management', action: 'List users', icon: 'Users', severity: 'info' } },
  { pattern: /^\/user\/pwd\/([0-9a-f-]+)$/i,
    activity: { category: 'User Management', action: 'Update password', icon: 'Lock', severity: 'warning' } },
  { pattern: /^\/user\/activate\/([0-9a-f-]+)$/i,
    activity: { category: 'User Management', action: 'Activate user', icon: 'ToggleRight', severity: 'success' } },
  { pattern: /^\/user\/deactivate\/([0-9a-f-]+)$/i,
    activity: { category: 'User Management', action: 'Deactivate user', icon: 'ToggleLeft', severity: 'warning' } },
  { pattern: /^\/user\/pwd\/reset$/i,
    activity: { category: 'User Management', action: 'Generate password reset keys', icon: 'Mail', severity: 'info' } },
  { pattern: /^\/user\/pwd\/reset\/[^/]+\/[^/]+$/i,
    activity: { category: 'User Management', action: 'Reset password', icon: 'RotateCcw', severity: 'warning' } },
  { pattern: /^\/user\/update\/[0-9a-f-]+$/i,
    activity: { category: 'User Management', action: 'Update user', icon: 'UserCog', severity: 'warning' } },
  { pattern: /^\/user\/get\/[0-9a-f-]+$/i,
    activity: { category: 'User Management', action: 'Get user', icon: 'UserRoundSearch', severity: 'info' } },

  /** ---------- Access Control ---------- */
  { pattern: /^\/user\/access$/i,
    activity: { category: 'Access Control', action: 'Set user charity access', icon: 'BadgeCheck', severity: 'warning' } },
  { pattern: /^\/user\/access\/(RESET REQUEST)$/i,
    activity: { category: 'Access Control', action: 'Access reset lookup', icon: 'HelpCircle', severity: 'info' } },
  { pattern: /^\/user\/access\/(TEMPADMIN)$/i,
    activity: { category: 'Access Control', action: 'Temporary admin access lookup', icon: 'Shield', severity: 'info' } },
  { pattern: /^\/user\/access\/(SYSTEM UPDATE)$/i,
    activity: { category: 'Access Control', action: 'System access change', icon: 'Settings', severity: 'warning' } },
  { pattern: /^\/user\/access\/([0-9a-f-]+)$/i,
    activity: { category: 'Access Control', action: 'View user charity access', icon: 'KeyRound', severity: 'info' } },

  /** ---------- Charity Management ---------- */
  { pattern: /^\/charity$/i,
    activity: { category: 'Charity Management', action: 'Create charity', icon: 'Building', severity: 'success' } },
  { pattern: /^\/charity\/activate\/([0-9a-f-]+)$/i,
    activity: { category: 'Charity Management', action: 'Activate charity', icon: 'ToggleRight', severity: 'success' } },
  { pattern: /^\/charity\/deactivate\/([0-9a-f-]+)$/i,
    activity: { category: 'Charity Management', action: 'Deactivate charity', icon: 'ToggleLeft', severity: 'warning' } },
  { pattern: /^\/charity\/([0-9a-f-]+)$/i,
    activity: { category: 'Charity Management', action: 'View/Update charity', icon: 'Building2', severity: 'info' } },
  { pattern: /^\/charities$/i,
    activity: { category: 'Charity Management', action: 'List charities', icon: 'List', severity: 'info' } },

  /** ---------- Raffle Management ---------- */
  { pattern: /^\/raffle\/activate\/([0-9a-f-]+)$/i,
    activity: { category: 'Raffle Management', action: 'Activate raffle', icon: 'ToggleRight', severity: 'success' } },
  { pattern: /^\/raffle\/deactivate\/([0-9a-f-]+)$/i,
    activity: { category: 'Raffle Management', action: 'Deactivate raffle', icon: 'ToggleLeft', severity: 'warning' } },
  { pattern: /^\/charity\/raffles\/([0-9a-f-]+)$/i,
    activity: { category: 'Raffle Management', action: 'List raffles for charity', icon: 'Layers', severity: 'info' } },
  { pattern: /^\/raffle\/([0-9a-f-]+)$/i,
    activity: { category: 'Raffle Management', action: 'View/Update raffle', icon: 'Ticket', severity: 'info' } },
  { pattern: /^\/raffle\/details\/([0-9a-f-]+)$/i,
    activity: { category: 'Raffle Management', action: 'Update raffle details', icon: 'FileText', severity: 'warning' } },
  { pattern: /^\/raffle\/rules\/([0-9a-f-]+)$/i,
    activity: { category: 'Raffle Management', action: 'Update raffle rules', icon: 'Scale', severity: 'warning' } },

  /** ---------- Templates ---------- */
  { pattern: /^\/template\/list\/([0-9a-f-]+)$/i,
    activity: { category: 'Templates', action: 'List templates', icon: 'Files', severity: 'info' } },
  { pattern: /^\/template\/([0-9a-f-]+)\/1$/i,
    activity: { category: 'Templates', action: 'Update purchase template', icon: 'FilePenLine', severity: 'warning' } },
  { pattern: /^\/template\/([0-9a-f-]+)\/2$/i,
    activity: { category: 'Templates', action: 'Update winner template', icon: 'FilePenLine', severity: 'warning' } },
  { pattern: /^\/template\/([0-9a-f-]+)\/(\d+)$/i,
    activity: { category: 'Templates', action: 'Get template', icon: 'File', severity: 'info' } },

  /** ---------- Prize Management ---------- */
  { pattern: /^\/prize\/list\/([0-9a-f-]+)$/i,
    activity: { category: 'Prize Management', action: 'List prizes', icon: 'Trophy', severity: 'info' } },
  { pattern: /^\/prize\/assign\/([0-9a-f-]+)$/i,
    activity: { category: 'Prize Management', action: 'Assign prize to ticket', icon: 'Link', severity: 'warning' } },
  { pattern: /^\/prize\/paidout\/([0-9a-f-]+)$/i,
    activity: { category: 'Prize Management', action: 'Mark prize paid out', icon: 'Banknote', severity: 'success' } },
  { pattern: /^\/prize\/unclaimed\/([0-9a-f-]+)$/i,
    activity: { category: 'Prize Management', action: 'Mark prize unclaimed', icon: 'Clock', severity: 'warning' } },
  { pattern: /^\/prize\/donate\/([0-9a-f-]+)$/i,
    activity: { category: 'Prize Management', action: 'Donate prize', icon: 'Heart', severity: 'success' } },
  { pattern: /^\/prize\/([0-9a-f-]+)$/i,
    activity: { category: 'Prize Management', action: 'View/Update/Delete prize', icon: 'Trophy', severity: 'warning' } },

  /** ---------- Buy-In Management ---------- */
  { pattern: /^\/buyins\/([0-9a-f-]+)$/i,
    activity: { category: 'Buy-In Management', action: 'List buy-ins', icon: 'ShoppingBag', severity: 'info' } },
  { pattern: /^\/buyin\/([0-9a-f-]+)$/i,
    activity: { category: 'Buy-In Management', action: 'View/Update/Delete/Create buy-in', icon: 'ShoppingCart', severity: 'warning' } },

  /** ---------- Ticket Operations ---------- */
  { pattern: /^\/ticket\/list\/([0-9a-f-]+)$/i,
    activity: { category: 'Ticket Operations', action: 'List tickets', icon: 'Tickets', severity: 'info' } },
  { pattern: /^\/ticket\/void\/([0-9a-f-]+)\/(\d+)$/i,
    activity: { category: 'Ticket Operations', action: 'Void ticket', icon: 'Ban', severity: 'danger' } },
  { pattern: /^\/ticket\/unvoid\/([0-9a-f-]+)\/(\d+)$/i,
    activity: { category: 'Ticket Operations', action: 'Un-void ticket', icon: 'Undo2', severity: 'warning' } },
  { pattern: /^\/ticket\/unvoid\/all\/([a-z0-9_:-]+)$/i,
    activity: { category: 'Ticket Operations', action: 'Un-void all tickets for purchase', icon: 'Undo2', severity: 'warning' } },
  { pattern: /^\/ticket\/([0-9a-f-]+)\/(\d+)$/i,
    activity: { category: 'Ticket Operations', action: 'Get ticket details', icon: 'Ticket', severity: 'info' } },

  /** ---------- Banners & Media ---------- */
  { pattern: /^\/banner\/types\/?$/i,
    activity: { category: 'Banners & Media', action: 'List banner types', icon: 'Tags', severity: 'info' } },
  { pattern: /^\/banner\/list\/([0-9a-f-]+)\/(0|1)$/i,
    activity: { category: 'Banners & Media', action: 'List banners', icon: 'Images', severity: 'info' } },
  { pattern: /^\/banner\/([0-9a-f-]+)\/(\d+)$/i,
    activity: { category: 'Banners & Media', action: 'Get banner', icon: 'Image', severity: 'info' } },
  { pattern: /^\/banner\/?$/i,
    activity: { category: 'Banners & Media', action: 'Create/Update banner', icon: 'ImagePlus', severity: 'warning' } },

  /** ---------- Reporting & Audit ---------- */
  { pattern: /^\/report\/summary$/i,
    activity: { category: 'Reporting & Audit', action: 'View system summary report', icon: 'BarChart3', severity: 'info' } },
  { pattern: /^\/report\/topsales$/i,
    activity: { category: 'Reporting & Audit', action: 'View top sales report', icon: 'Trophy', severity: 'info' } },
  { pattern: /^\/report\/topraffle$/i,
    activity: { category: 'Reporting & Audit', action: 'View top raffle count report', icon: 'Trophy', severity: 'info' } },
  { pattern: /^\/report\/tickets\/([0-9a-f-]+)$/i,
    activity: { category: 'Reporting & Audit', action: 'View tickets report', icon: 'Table2', severity: 'info' } },
  { pattern: /^\/report\/void\/([0-9a-f-]+)$/i,
    activity: { category: 'Reporting & Audit', action: 'View voided tickets report', icon: 'AlertTriangle', severity: 'warning' } },
  { pattern: /^\/report\/userchanges\/([0-9a-f-]+)$/i,
    activity: { category: 'Reporting & Audit', action: 'View user change log', icon: 'UserCog', severity: 'info' } },
  { pattern: /^\/report\/rafflesummary$/i,
    activity: { category: 'Reporting & Audit', action: 'View raffle summary report', icon: 'PieChart', severity: 'info' } },
  { pattern: /^\/report\/rafflerefunds$/i,
    activity: { category: 'Reporting & Audit', action: 'View raffle refunds report', icon: 'Receipt', severity: 'info' } },
  { pattern: /^\/report\/rafflestatus$/i,
    activity: { category: 'Reporting & Audit', action: 'View raffle status report', icon: 'ListChecks', severity: 'info' } },
]

// Normalize URL to path and map.
export function describeApiCall(fullUrl: string): Activity & { path: string } {
  try {
    const path = fullUrl
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/:undefined/i, '')
      .replace(/\/+$/, '')
      .trim() || '/'

    const match = ACTIVITY_RULES.find(r => r.pattern.test(path))
    if (match) return { ...match.activity, path }

    // Fallbacks by area
    if (/^\/user\//i.test(path))   return { category: 'User Management',  action: 'User API call', icon: 'UserRound', severity: 'info', path }
    if (/^\/raffle\//i.test(path)) return { category: 'Raffle Management', action: 'Raffle API call', icon: 'Ticket', severity: 'info', path }
    if (/^\/ticket\//i.test(path)) return { category: 'Ticket Operations', action: 'Ticket API call', icon: 'Ticket', severity: 'info', path }
    if (/^\/report\//i.test(path)) return { category: 'Reporting & Audit', action: 'Report API call', icon: 'BarChart3', severity: 'info', path }
    if (/^\/banner\//i.test(path)) return { category: 'Banners & Media', action: 'Banner API call', icon: 'Image', severity: 'info', path }
    if (/^\/template\//i.test(path)) return { category: 'Templates', action: 'Template API call', icon: 'File', severity: 'info', path }

    return { category: 'Other', action: 'API call', icon: 'Circle', severity: 'info', path }
  } catch {
    return { category: 'Other', action: 'API call', icon: 'Circle', severity: 'info', path: fullUrl }
  }
}