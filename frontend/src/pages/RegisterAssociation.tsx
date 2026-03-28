import { useState } from "react";
import type { FormEvent } from "react";
import { registerAssociation } from "../services/auth";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterAssociation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    association_name: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await registerAssociation(form);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar associação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white px-4">
      <div className="w-full max-w-md bg-zinc-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Cadastrar associação
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Seu nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            placeholder="Nome da associação"
            value={form.association_name}
            onChange={(e) =>
              setForm({ ...form, association_name: e.target.value })
            }
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
            value={form.password_confirmation}
            onChange={(e) =>
              setForm({ ...form, password_confirmation: e.target.value })
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
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
