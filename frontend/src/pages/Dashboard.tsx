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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-zinc-300 text-lg">Carregando dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-zinc-800 rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-semibold mb-3">Dashboard</h1>
          <p className="text-zinc-400">Não foi possível carregar os dados.</p>
        </div>
      </div>
    );
  }

  const { user, membership, association } = data;

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 mt-2">Bem-vindo, {user.name}.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-zinc-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Dados do usuário</h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-zinc-400">ID:</span>
                <p className="text-white font-medium">{user.id}</p>
              </div>

              <div>
                <span className="text-zinc-400">Nome:</span>
                <p className="text-white font-medium">{user.name}</p>
              </div>

              <div>
                <span className="text-zinc-400">Email:</span>
                <p className="text-white font-medium">{user.email}</p>
              </div>

              <div>
                <span className="text-zinc-400">Telefone:</span>
                <p className="text-white font-medium">{user.phone}</p>
              </div>

              <div>
                <span className="text-zinc-400">Perfil:</span>
                <p className="text-white font-medium">{user.role}</p>
              </div>

              <div>
                <span className="text-zinc-400">Status:</span>
                <p
                  className={`font-medium ${
                    user.isActive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {user.isActive ? "Ativo" : "Inativo"}
                </p>
              </div>

              <div>
                <span className="text-zinc-400">Criado em:</span>
                <p className="text-white font-medium">
                  {formatDate(user.createdAt)}
                </p>
              </div>

              <div>
                <span className="text-zinc-400">Atualizado em:</span>
                <p className="text-white font-medium">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Associação</h2>

            {association ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-zinc-400">ID:</span>
                  <p className="text-white font-medium">{association.id}</p>
                </div>

                <div>
                  <span className="text-zinc-400">Nome:</span>
                  <p className="text-white font-medium">{association.name}</p>
                </div>

                <div>
                  <span className="text-zinc-400">Slug:</span>
                  <p className="text-white font-medium">
                    {association.slug || "Não informado"}
                  </p>
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
            ) : (
              <p className="text-zinc-400">
                Nenhuma associação vinculada no momento.
              </p>
            )}
          </div>

          <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Vínculo do usuário</h2>

            {membership ? (
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div>
                  <span className="text-zinc-400">ID do vínculo:</span>
                  <p className="text-white font-medium">{membership.id}</p>
                </div>

                <div>
                  <span className="text-zinc-400">Status:</span>
                  <p className="text-white font-medium">{membership.status}</p>
                </div>

                <div>
                  <span className="text-zinc-400">Aprovado em:</span>
                  <p className="text-white font-medium">
                    {formatDate(membership.approvedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-zinc-400">
                Este usuário ainda não possui vínculo com uma associação.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
