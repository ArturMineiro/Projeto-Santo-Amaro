export type DashboardData = {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  };
  membership: {
    id: number;
    status: string;
    approvedAt?: string | null;
  } | null;
  association: {
    id: number;
    name: string;
    slug?: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
};
