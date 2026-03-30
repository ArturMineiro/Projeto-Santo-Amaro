export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterAssociationPayload {
  name: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Association {
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
}

export interface LoginResponse {
  token: string;
  association: Association;
}

export interface MeResponse {
  association: Association;
}
