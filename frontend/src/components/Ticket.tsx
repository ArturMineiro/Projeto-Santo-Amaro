import type { ReactNode } from "react";
import { daysSince, relativeDate } from "../lib/format";
import type { Package } from "../lib/types";
import { PackageTypeIcon } from "./Icons";

/**
 * O "canhoto" da encomenda: o código de retirada fica no destaque amarelo,
 * como o papelzinho que a associação entregaria em mãos.
 */
export default function Ticket({
  pkg,
  title,
  subtitle,
  footer,
  className = "",
  codeLabel = "Código",
}: {
  pkg: Package;
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  className?: string;
  codeLabel?: string;
}) {
  const late = pkg.status === "received" && daysSince(pkg.arrived_at) >= 7;

  return (
    <div className={`ticket ${className}`}>
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-center gap-2 text-muted">
          <PackageTypeIcon type={pkg.type} size={22} className="shrink-0 text-leaf" />
          <span className="font-bold capitalize text-leaf-dark">{pkg.type_label}</span>
          {pkg.carrier && <span className="truncate">de {pkg.carrier}</span>}
        </div>
        <div className="mt-1 text-[1.25rem] font-bold leading-snug">{title ?? pkg.description ?? "Sem descrição"}</div>
        {subtitle && <div className="mt-0.5 text-muted">{subtitle}</div>}
        <div className={`mt-2 text-[1rem] ${late ? "font-bold text-alert" : "text-muted"}`}>
          {pkg.status === "picked_up"
            ? `Retirada ${relativeDate(pkg.picked_up_at)}`
            : `Chegou ${relativeDate(pkg.arrived_at)}${late ? `, esperando há ${daysSince(pkg.arrived_at)} dias` : ""}`}
        </div>
        {footer}
      </div>
      <div className={`ticket-stub ${pkg.status === "picked_up" ? "!bg-line" : ""}`}>
        <span className="text-[0.875rem] font-bold">{codeLabel}</span>
        <span className="ticket-code mt-1" aria-label={`Código ${pkg.pickup_code.split("").join(" ")}`}>
          {pkg.pickup_code}
        </span>
      </div>
    </div>
  );
}
