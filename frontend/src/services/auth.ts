import api from "../api/axios";

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

export async function login(payload: LoginPayload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function registerAssociation(payload: RegisterAssociationPayload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function me() {
  const userId = localStorage.getItem("userId");
  const response = await api.get(`/auth/me/${userId}`);
  return response.data;
}
