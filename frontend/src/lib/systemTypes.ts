/** Tipos do painel da administração do sistema (/api/system/*). */

export interface PageMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface PageOf<T> {
  data: T[];
  meta: PageMeta;
}

export interface SystemInfo {
  app_name: string;
  environment: string;
  debug: boolean;
  url: string;
  timezone: string;
  laravel_version: string;
  php_version: string;
  database: string;
  whatsapp_driver: string;
  mail_mailer: string;
  queue_connection: string;
  queue_pending: number | null;
  queue_failed: number | null;
  migrations: number | null;
  disk_free: number | null;
  disk_total: number | null;
  log_size: number;
  server_time: string;
}

export interface SystemOverview {
  totals: {
    associations: number;
    associations_inactive: number;
    users: number;
    users_without_access: number;
    memberships_approved: number;
    memberships_pending: number;
    memberships_rejected: number;
    admins: number;
    packages: number;
    packages_waiting: number;
    packages_waiting_over_7_days: number;
    packages_today: number;
  };
  notifications_7d: {
    whatsapp_sent: number;
    whatsapp_manual: number;
    whatsapp_failed: number;
    email_sent: number;
    email_failed: number;
  };
  packages_per_day: { day: string; total: number }[];
  busiest: { id: number; name: string; waiting_count: number }[];
  system: SystemInfo;
  warnings: { tone: "warning" | "error"; text: string }[];
}

export interface SystemAssociation {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
  residents_count: number;
  pending_count: number;
  packages_count: number;
  waiting_count: number;
  last_package_at: string | null;
}

export interface SystemMembership {
  id: number;
  role: "admin" | "resident";
  status: "pending" | "approved" | "rejected";
  unit: string | null;
  created_at: string | null;
  approved_at: string | null;
  waiting_packages: number | null;
  user: { id: number; name: string; phone_formatted: string; email: string | null; has_access: boolean; is_active: boolean };
  association: { id: number; name: string; is_active: boolean } | null;
}

export interface ActivityEntry {
  id: number;
  action: string;
  description: string;
  ip: string | null;
  meta: Record<string, unknown> | null;
  created_at: string | null;
  user: { id: number; name: string } | null;
  association: { id: number; name: string } | null;
}

export interface SystemAssociationDetail extends SystemAssociation {
  invite_code: string;
  pickup_hours: string | null;
  created_at: string | null;
  failed_notifications_30d: number;
  memberships: SystemMembership[];
  recent_activity: ActivityEntry[];
}

export interface NotificationEntry {
  id: number;
  channel: "whatsapp" | "email";
  status: "sent" | "failed";
  provider: string | null;
  recipient: string;
  error: string | null;
  created_at: string | null;
  package_id: number;
  resident: string | null;
  association: { id: number; name: string } | null;
}

export interface AppLogEntry {
  time: string;
  level: string;
  message: string;
  details: string | null;
}
