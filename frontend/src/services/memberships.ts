import api from "../api/axios";

export async function getPendingMemberships() {
  const { data } = await api.get("/memberships/pending");
  return data;
}

export async function approveMembership(id: number) {
  const { data } = await api.post(`/memberships/${id}/approve`);
  return data;
}

export async function rejectMembership(id: number, rejection_reason: string) {
  const { data } = await api.post(`/memberships/${id}/reject`, {
    rejection_reason,
  });
  return data;
}
