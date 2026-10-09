import { daysSince, relativeDate } from "../../lib/format";
import type { Package } from "../../lib/types";
import { IconChevron, PackageTypeIcon } from "../Icons";

/** Linha compacta da lista da administração. */
export default function PackageRow({ pkg, onOpen }: { pkg: Package; onOpen: (id: number) => void }) {
  const waiting = pkg.status === "received";
  const late = waiting && daysSince(pkg.arrived_at) >= 7;

  return (
    <button type="button" onClick={() => onOpen(pkg.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper">
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-[12px] ${waiting ? "bg-sun-soft text-sun-dark" : "bg-paper text-muted"}`}
      >
        <PackageTypeIcon type={pkg.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{pkg.resident?.name}</span>
        <span className="block truncate text-[1rem] text-muted">
          {[pkg.unit, pkg.description ?? pkg.type_label].filter(Boolean).join(", ")}
        </span>
        <span className={`block text-[0.9375rem] ${late ? "font-bold text-alert" : "text-muted"}`}>
          {waiting ? `Chegou ${relativeDate(pkg.arrived_at)}` : `Retirada ${relativeDate(pkg.picked_up_at)}`}
        </span>
      </span>
      <span className="font-display text-[1.25rem] font-extrabold tracking-[0.06em] tabular-nums text-ink">{pkg.pickup_code}</span>
      <IconChevron className="shrink-0 text-muted" size={20} />
    </button>
  );
}
