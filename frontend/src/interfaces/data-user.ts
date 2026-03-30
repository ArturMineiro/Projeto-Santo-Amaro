export interface DashboardData {
  association: {
    id: number;
    name: string;
    documentNumber: string;
    email: string;
    phone: string;
    zipCode: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    approvalStatus: "pending" | "approved" | "rejected";
    isActive: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
}
