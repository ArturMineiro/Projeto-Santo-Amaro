import type { PillTone } from "../components/system/common";

export const statusLabel = {
  approved: { text: "Confirmado", tone: "green" },
  pending: { text: "Para confirmar", tone: "yellow" },
  rejected: { text: "Recusado", tone: "red" },
} as const;

/** Nome legível para cada tipo de atividade do log. */
export const ACTIONS: Record<string, string> = {
  "auth.login": "Entrou",
  "auth.login_failed": "Senha errada",
  "association.created": "Associação criada",
  "association.updated": "Associação alterada",
  "association.invite_regenerated": "Novo código",
  "association.activated": "Associação reativada",
  "association.deactivated": "Associação desativada",
  "resident.signed_up": "Cadastro pelo código",
  "resident.created": "Morador cadastrado",
  "resident.approved": "Cadastro aprovado",
  "resident.rejected": "Cadastro recusado",
  "resident.removed": "Morador removido",
  "resident.role_changed": "Papel alterado",
  "package.created": "Encomenda registrada",
  "package.picked_up": "Entregue",
  "package.pickup_undone": "Entrega desfeita",
  "package.deleted": "Registro apagado",
  "package.notify_resent": "Aviso reenviado",
  "package.notified_manually": "Aviso manual",
};

export function actionTone(action: string): PillTone {
  if (action === "auth.login_failed" || action.endsWith("deactivated") || action.endsWith("deleted") || action.endsWith("removed") || action.endsWith("rejected")) return "red";
  if (action.startsWith("package.")) return "yellow";
  if (action.startsWith("auth.")) return "gray";
  return "green";
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[i]}`;
}

