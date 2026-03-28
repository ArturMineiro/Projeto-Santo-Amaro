import { useState } from "react";
import type { FormEvent } from "react";
import { login } from "../services/auth";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      const data = await login(form);

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", String(data.user.id));

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Erro ao fazer login.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
      <div className="w-full max-w-md bg-zinc-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Bem-vindo 👋
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            className="px-4 py-3 rounded-lg bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Senha"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-lg font-medium"
          >
            Entrar
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-6 text-center">
          Não tem conta?{" "}
          <Link
            to="/cadastro-associacao"
            className="text-blue-500 hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
