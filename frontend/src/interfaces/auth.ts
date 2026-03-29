export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterAssociationPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  association_name: string;
}
