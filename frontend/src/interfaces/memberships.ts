export interface MembershipUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export interface MembershipAssociation {
  id: number;
  name: string;
  slug?: string | null;
}

export interface Membership {
  id: number;
  status: string;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  user?: MembershipUser | null;
  association?: MembershipAssociation | null;
}
