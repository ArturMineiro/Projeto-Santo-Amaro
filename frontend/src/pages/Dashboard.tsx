import { useEffect, useState } from "react";
import { me } from "../services/auth";
import type { DashboardData } from "../interfaces/data-user";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then((response) => setData(response))
      .catch((error) => {
        console.error(error);
        alert("Erro ao carregar os dados do dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  function formatDate(date?: string | null) {
    if (!date) return "Não informado";
    return new Date(date).toLocaleString("pt-BR");
  }

  function translateStatus(status?: string) {
    if (status === "pending") return "Pendente";
    if (status === "approved") return "Aprovada";
    if (status === "rejected") return "Rejeitada";
    return "Não informado";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-zinc-300 text-lg">Carregando dashboard...</p>
      </div>
    );
  }

  if (!data?.association) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-zinc-800 rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-semibold mb-3">Dashboard</h1>
          <p className="text-zinc-400">Não foi possível carregar os dados.</p>
        </div>
      </div>
    );
  }

  const { association } = data;

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 mt-2">Bem-vindo, {association.name}.</p>
        </div>

        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dados da associação</h2>

          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <span className="text-zinc-400">ID:</span>
              <p className="text-white font-medium">{association.id}</p>
            </div>

            <div>
              <span className="text-zinc-400">Nome:</span>
              <p className="text-white font-medium">{association.name}</p>
            </div>

            <div>
              <span className="text-zinc-400">CPF/CNPJ:</span>
              <p className="text-white font-medium">
                {association.documentNumber}
              </p>
            </div>

            <div>
              <span className="text-zinc-400">Email:</span>
              <p className="text-white font-medium">{association.email}</p>
            </div>

            <div>
              <span className="text-zinc-400">Telefone:</span>
              <p className="text-white font-medium">{association.phone}</p>
            </div>

            <div>
              <span className="text-zinc-400">Status de aprovação:</span>
              <p className="text-white font-medium">
                {translateStatus(association.approvalStatus)}
              </p>
            </div>

            <div>
              <span className="text-zinc-400">Status da conta:</span>
              <p
                className={`font-medium ${
                  association.isActive ? "text-green-400" : "text-red-400"
                }`}
              >
                {association.isActive ? "Ativa" : "Inativa"}
              </p>
            </div>

            <div>
              <span className="text-zinc-400">CEP:</span>
              <p className="text-white font-medium">{association.zipCode}</p>
            </div>

            <div>
              <span className="text-zinc-400">Rua:</span>
              <p className="text-white font-medium">{association.street}</p>
            </div>

            <div>
              <span className="text-zinc-400">Número:</span>
              <p className="text-white font-medium">{association.number}</p>
            </div>

            <div>
              <span className="text-zinc-400">Complemento:</span>
              <p className="text-white font-medium">
                {association.complement || "Não informado"}
              </p>
            </div>

            <div>
              <span className="text-zinc-400">Bairro:</span>
              <p className="text-white font-medium">
                {association.neighborhood}
              </p>
            </div>

            <div>
              <span className="text-zinc-400">Cidade:</span>
              <p className="text-white font-medium">{association.city}</p>
            </div>

            <div>
              <span className="text-zinc-400">Estado:</span>
              <p className="text-white font-medium">{association.state}</p>
            </div>

            <div>
              <span className="text-zinc-400">Criada em:</span>
              <p className="text-white font-medium">
                {formatDate(association.createdAt)}
              </p>
            </div>

            <div>
              <span className="text-zinc-400">Atualizada em:</span>
              <p className="text-white font-medium">
                {formatDate(association.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
