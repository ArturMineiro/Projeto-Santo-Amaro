import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import AuthShell from "../components/AuthShell";
import { IconClock } from "../components/Icons";
import { toast } from "../lib/toast";

/** Cadastro feito, esperando a associação confirmar (ou recusado / sem vínculo). */
export default function Waiting() {
  const { membership, refresh, logout, session } = useAuth();
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    const next = await refresh();
    setChecking(false);
    if (next && !next.memberships.some((m) => m.status === "approved")) {
      toast("Ainda não foi confirmado. Tente mais tarde.");
    }
  }

  if (!membership) {
    return (
      <AuthShell title={`Olá, ${session?.user.first_name}!`}>
        <p>Você ainda não faz parte de nenhuma associação.</p>
        <Link to="/cadastro" className="btn-primary mt-5 w-full">
          Entrar com o código da associação
        </Link>
        <button type="button" className="btn-secondary mt-3 w-full" onClick={() => void logout()}>
          Sair
        </button>
      </AuthShell>
    );
  }

  if (membership.status === "rejected") {
    return (
      <AuthShell title="Cadastro não aprovado">
        <p>
          A <strong>{membership.association?.name}</strong> não confirmou seu cadastro.
        </p>
        {membership.rejection_reason && (
          <p className="mt-3 rounded-btn bg-alert-soft p-4 text-alert">Motivo: {membership.rejection_reason}</p>
        )}
        <p className="mt-3 text-muted">Se achar que foi engano, fale com a administração da associação.</p>
        <button type="button" className="btn-secondary mt-6 w-full" onClick={() => void logout()}>
          Sair
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Cadastro enviado!">
      <div className="flex items-start gap-3">
        <IconClock size={32} className="shrink-0 text-sun-dark" />
        <p>
          A <strong>{membership.association?.name}</strong> vai confirmar que você é morador. Isso costuma ser rápido.
        </p>
      </div>
      <p className="mt-4 text-muted">
        Depois de confirmado, toda encomenda que chegar no seu nome gera um aviso no WhatsApp {session?.user.phone_formatted}.
      </p>
      <button type="button" className="btn-primary mt-6 w-full" onClick={() => void check()} disabled={checking}>
        {checking ? "Conferindo…" : "Já foi confirmado?"}
      </button>
      <button type="button" className="btn-secondary mt-3 w-full" onClick={() => void logout()}>
        Sair
      </button>
    </AuthShell>
  );
}
