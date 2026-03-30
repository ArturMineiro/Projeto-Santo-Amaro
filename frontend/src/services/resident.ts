// services/resident.ts
import api from "../api/axios";

export function createResident(associationId: number, data: any) {
  return api.post(`/residents/${associationId}`, data);
}
