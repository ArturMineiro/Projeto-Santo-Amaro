import api from "../api/axios";
import type {
  LoginPayload,
  RegisterAssociationPayload,
} from "../interfaces/auth";

export async function login(payload: LoginPayload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function registerAssociation(payload: RegisterAssociationPayload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function me() {
  const associationId = localStorage.getItem("associationId");
  const response = await api.get(`/auth/me/${associationId}`);
  return response.data;
}
