import { useEffect, useState } from "react";
import {
  approveMembership,
  getPendingMemberships,
  rejectMembership,
} from "../services/memberships";
import type { Membership } from "../interfaces/memberships";

export default function PendingMemberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  async function loadMemberships() {
    try {
      setLoading(true);
      const data = await getPendingMemberships();
      setMemberships(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar vínculos pendentes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemberships();
  }, []);

  async function handleApprove(id: number) {
    try {
      await approveMembership(id);
      alert("Vínculo aprovado com sucesso.");
      loadMemberships();
    } catch (error) {
      console.error(error);
      alert("Erro ao aprovar vínculo.");
    }
  }

  async function handleReject(id: number) {
    if (!reason.trim()) {
      alert("Informe o motivo da rejeição.");
      return;
    }

    try {
      await rejectMembership(id, reason);
      alert("Vínculo rejeitado com sucesso.");
      setRejectingId(null);
      setReason("");
      loadMemberships();
    } catch (error) {
      console.error(error);
      alert("Erro ao rejeitar vínculo.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Carregando vínculos pendentes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Vínculos pendentes</h1>

        {memberships.length === 0 ? (
          <div className="bg-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400">
              Não há vínculos pendentes no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                className="bg-zinc-800 rounded-2xl shadow-lg p-6"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-zinc-400 text-sm">ID do vínculo</p>
                    <p className="font-medium">{membership.id}</p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">Status</p>
                    <p className="font-medium capitalize">
                      {membership.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">Usuário</p>
                    <p className="font-medium">
                      {membership.user?.name || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">Email</p>
                    <p className="font-medium">
                      {membership.user?.email || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">Associação</p>
                    <p className="font-medium">
                      {membership.association?.name || "Não informada"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => handleApprove(membership.id)}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition"
                  >
                    Aprovar
                  </button>

                  <button
                    onClick={() => {
                      setRejectingId(membership.id);
                      setReason("");
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition"
                  >
                    Rejeitar
                  </button>
                </div>

                {rejectingId === membership.id && (
                  <div className="mt-4 bg-zinc-900 rounded-xl p-4">
                    <label className="block text-sm text-zinc-300 mb-2">
                      Motivo da rejeição
                    </label>

                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-xl bg-zinc-800 border border-zinc-700 p-3 text-white outline-none"
                      rows={4}
                      placeholder="Digite o motivo da rejeição"
                    />

                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => handleReject(membership.id)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition"
                      >
                        Confirmar rejeição
                      </button>

                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setReason("");
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
