import { useEffect, useState } from "react";
import { createResident } from "../services/resident";
import { me } from "../services/auth";
import { Link } from "react-router-dom";

export default function CreateResident() {
  const [associationId, setAssociationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    me()
      .then((res) => setAssociationId(res.association.id))
      .catch(() => alert("Erro ao carregar associação"));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!associationId) return;

    if (!form.name || !form.email) {
      alert("Nome e email são obrigatórios");
      return;
    }

    try {
      setLoading(true);

      await createResident(associationId, form);

      alert("Morador cadastrado com sucesso!");

      setForm({
        name: "",
        email: "",
        phone: "",
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar morador.");
    } finally {
      setLoading(false);
    }
  }

  if (!associationId) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-zinc-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto bg-zinc-800 rounded-2xl shadow-xl p-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Cadastrar Morador</h1>
            <p className="text-zinc-400 mt-1">Preencha os dados abaixo</p>
          </div>

          <Link to="/dashboard" className="text-blue-500 hover:underline">
            ← Voltar ao dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* DADOS PESSOAIS */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Dados pessoais</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Nome"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nome completo"
              />
              <Input
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@email.com"
              />
              <Input
                label="Telefone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(21) 99999-9999"
              />
            </div>
          </div>

          {/* ENDEREÇO */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Endereço</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="CEP"
                name="zipCode"
                value={form.zipCode}
                onChange={handleChange}
                placeholder="00000-000"
              />
              <Input
                label="Rua"
                name="street"
                value={form.street}
                onChange={handleChange}
                placeholder="Rua exemplo"
              />
              <Input
                label="Número"
                name="number"
                value={form.number}
                onChange={handleChange}
                placeholder="123"
              />
              <Input
                label="Complemento"
                name="complement"
                value={form.complement}
                onChange={handleChange}
                placeholder="Apto, bloco..."
              />
              <Input
                label="Bairro"
                name="neighborhood"
                value={form.neighborhood}
                onChange={handleChange}
                placeholder="Bairro"
              />
              <Input
                label="Cidade"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Cidade"
              />
              <Input
                label="Estado"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="RJ"
              />
            </div>
          </div>

          {/* BOTÃO */}
          <button
            disabled={loading}
            className={`
              w-full py-3 rounded-xl font-medium
              transition-all duration-200
              ${
                loading
                  ? "bg-zinc-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-lg shadow-blue-600/20"
              }
            `}
          >
            {loading ? "Salvando..." : "Cadastrar morador"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  ...props
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm text-zinc-400">{label}</label>
      <input
        {...props}
        className="
          w-full mt-1 px-4 py-3 rounded-xl
          bg-zinc-700/50 border border-zinc-600
          text-white placeholder-zinc-400
          focus:outline-none focus:ring-2 focus:ring-blue-500
          focus:border-transparent
          transition-all duration-200
        "
      />
    </div>
  );
}
