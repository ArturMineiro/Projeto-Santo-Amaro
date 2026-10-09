import api, { errorMessage } from "../../lib/api";
import { toast } from "../../lib/toast";
import type { Package } from "../../lib/types";
import { IconWhatsApp } from "../Icons";

/**
 * Aviso gratuito: abre o WhatsApp de quem está usando o painel com a mensagem
 * pronta (link wa.me) e registra no sistema que o morador foi avisado.
 * É um link de verdade (<a>), para o celular abrir o app do WhatsApp normalmente.
 */
export default function ManualWhatsAppButton({
  pkg,
  onRegistered,
  label = "Avisar pelo meu WhatsApp",
}: {
  pkg: Package;
  onRegistered?: (pkg: Package) => void;
  label?: string;
}) {
  if (!pkg.whatsapp_link) return null;

  async function register() {
    try {
      const { data } = await api.post<{ message: string; package: Package }>(`/admin/packages/${pkg.id}/notified-manually`);
      onRegistered?.(data.package);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  }

  return (
    <a href={pkg.whatsapp_link} target="_blank" rel="noreferrer" className="btn-whatsapp w-full" onClick={() => void register()}>
      <IconWhatsApp />
      {label}
    </a>
  );
}
