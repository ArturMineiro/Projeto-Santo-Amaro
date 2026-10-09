export type Role = "admin" | "resident";
export type MembershipStatus = "pending" | "approved" | "rejected";
export type PackageType = "package" | "letter" | "document" | "other";
export type PackageStatus = "received" | "picked_up";

export interface User {
  id: number;
  name: string;
  first_name: string;
  phone: string;
  phone_formatted: string;
  email: string | null;
  notify_whatsapp: boolean;
  notify_email: boolean;
  has_access: boolean;
  created_at: string | null;
}

export interface Association {
  id: number;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  pickup_hours: string | null;
  invite_code?: string;
}

export interface Membership {
  id: number;
  role: Role;
  status: MembershipStatus;
  unit: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  waiting_packages?: number;
  user?: User;
  association?: Association;
}

export interface PackageNotification {
  channel: "whatsapp" | "email";
  status: "sent" | "failed";
  /** true = a administração avisou pelo próprio WhatsApp (botão wa.me) */
  manual?: boolean;
  recipient: string;
  error: string | null;
  created_at: string | null;
}

export interface Package {
  id: number;
  type: PackageType;
  type_label: string;
  description: string | null;
  carrier: string | null;
  tracking_code: string | null;
  notes: string | null;
  status: PackageStatus;
  pickup_code: string;
  arrived_at: string | null;
  notified_at: string | null;
  picked_up_at: string | null;
  picked_up_by_name: string | null;
  unit?: string | null;
  resident?: User;
  registered_by?: string | null;
  delivered_by?: string | null;
  notifications?: PackageNotification[];
  whatsapp_link?: string;
}

export interface Session {
  user: User;
  memberships: Membership[];
}

export interface SessionResponse extends Session {
  message: string;
  token: string;
}

export interface Dashboard {
  waiting: number;
  waiting_over_7_days: number;
  waiting_not_notified: number;
  received_today: number;
  picked_up_today: number;
  residents: number;
  pending_residents: number;
  failed_notifications_7d: number;
  whatsapp_enabled: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; total: number; per_page: number };
}
