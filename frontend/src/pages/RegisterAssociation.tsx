import { useState } from "react";
import type { FormEvent } from "react";
import { registerAssociation } from "../services/auth";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterAssociation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    documentNumber: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await registerAssociation(form);

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.association?.id) {
        localStorage.setItem("associationId", String(data.association.id));
      }

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar associação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white px-4 py-8">
      <div className="w-full max-w-2xl bg-zinc-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Cadastrar associação
        </h1>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
            placeholder="Nome da associação"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CPF ou CNPJ"
            value={form.documentNumber}
            onChange={(e) =>
              setForm({ ...form, documentNumber: e.target.value })
            }
            required
          />

          <input
            type="email"
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Telefone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CEP"
            value={form.zipCode}
            onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
            required
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
            placeholder="Rua"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            required
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Número"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            required
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Complemento"
            value={form.complement}
            onChange={(e) => setForm({ ...form, complement: e.target.value })}
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Bairro"
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
            required
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cidade"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />

          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
            placeholder="Estado"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            required
          />

          <input
            type="password"
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Senha"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <input
            type="password"
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirmar senha"
            value={form.passwordConfirmation}
            onChange={(e) =>
              setForm({ ...form, passwordConfirmation: e.target.value })
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-6 text-center">
          Já tem conta?{" "}
          <Link to="/" className="text-blue-500 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
