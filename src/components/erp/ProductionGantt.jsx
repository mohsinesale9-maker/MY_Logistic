import { useMemo } from "react";
import moment from "moment";
import { AlertTriangle, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const STATUT_BAR = {
  planifie: "bg-amber-400 border-amber-500",
  en_cours: "bg-blue-500 border-blue-600",
  termine: "bg-green-500 border-green-600",
  annule: "bg-gray-300 border-gray-400 opacity-60",
  en_retard: "bg-orange-500 border-orange-600 animate-pulse",
};

const STATUT_LABEL = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
  en_retard: "En retard",
};

const STATUT_TEXT_COLOR = {
  planifie: "text-amber-600",
  en_cours: "text-blue-600",
  terme: "text-green-600",
  annule: "text-gray-500",
  en_retard: "text-orange-600",
};

const PRIORITY_DOT = {
  haute: "bg-red-500",
  normale: "bg-blue-400",
  basse: "bg-gray-300",
};

const ROW_H = 52; // px per task row

// ── Timeline helpers ────────────────────────────────────────────────────────
function getTicksForRange(start, end, scale) {
  const ticks = [];
  const cursor = start.clone().startOf("day");

  if (scale === "semaine") {
    // Day-level ticks
    while (cursor.isSameOrBefore(end)) {
      const dayStart = cursor.clone();
      const dayEnd = cursor.clone().add(1, "day");
      ticks.push({
        label: cursor.format("ddd DD/MM"),
        short: cursor.format("DD"),
        sub: cursor.format("MMM"),
        startMs: dayStart.valueOf(),
        endMs: dayEnd.valueOf(),
        isToday: cursor.isSame(moment(), "day"),
      });
      cursor.add(1, "day");
    }
  } else {
    // Month view — week-level ticks
    let weekStart = start.clone().startOf("week");
    while (weekStart.isSameOrBefore(end)) {
      ticks.push({
        label: `S${weekStart.format("W")}`,
        short: weekStart.format("DD"),
        sub: weekStart.format("MMM"),
        startMs: weekStart.valueOf(),
        endMs: weekStart.clone().add(1, "week").valueOf(),
        isToday: weekStart.isSame(moment(), "week"),
      });
      weekStart.add(1, "week");
    }
  }
  return ticks;
}

function pctForTime(timeMs, rangeStartMs, rangeEndMs) {
  const total = rangeEndMs - rangeStartMs;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, ((timeMs - rangeStartMs) / total) * 100));
}

// ── Metric chip ───────────────────────────────────────────────────────────
function MetricChip({ label, value, alert, icon: Icon }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${alert ? "border-orange-300 bg-orange-50" : "bg-card"}`}>
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className={`text-lg font-bold ${alert ? "text-orange-600" : ""}`}>{value}</p>
    </div>
  );
}

// ── Statut badge ─────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const colors = {
    planifie: "bg-amber-50 text-amber-700 border-amber-200",
    en_cours: "bg-blue-50 text-blue-700 border-blue-200",
    termine: "bg-green-50 text-green-700 border-green-200",
    annule: "bg-gray-50 text-gray-500 border-gray-200",
    en_retard: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colors[statut] || colors.planifie}`}>
      {STATUT_LABEL[statut] || statut}
    </span>
  );
}

// ── Main Gantt component ─────────────────────────────────────────────────
export default function ProductionGantt({
  plannings,
  orders = [],
  viewStart,
  viewEnd,
  scale = "semaine",
  onSelectPlanning,
}) {
  const orderDeadlineMap = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (o.id && o.date_fin) map[o.id] = moment(o.date_fin).endOf("day");
    });
    return map;
  }, [orders]);

  const rangeStartMs = viewStart.clone().startOf("day").valueOf();
  const rangeEndMs = viewEnd.clone().endOf("day").valueOf();

  const ticks = useMemo(
    () => getTicksForRange(viewStart, viewEnd, scale),
    [viewStart, viewEnd, scale]
  );

  const totalMs = rangeEndMs - rangeStartMs;

  // Today's indicator position (%)
  const todayPct = pctForTime(moment().valueOf(), rangeStartMs, rangeEndMs);
  const isTodayInRange = todayPct >= 0 && todayPct <= 100;

  // Sorted plannings for display
  const sortedPlannings = useMemo(
    () => plannings
      .filter((planning) => moment(planning.start_datetime).isValid() && moment(planning.end_datetime).isValid())
      .sort((a, b) => moment(a.start_datetime).valueOf() - moment(b.start_datetime).valueOf()),
    [plannings]
  );

  // Stats
  const stats = useMemo(() => ({
    total: plannings.length,
    atRisk: plannings.filter((p) => {
      if (p.statut === "termine" || p.statut === "annule") return false;
      const dl = orderDeadlineMap[p.production_order_id];
      return dl && moment(p.end_datetime).isAfter(dl);
    }).length,
    chains: plannings.filter((p) => p.production_order_id && p.statut !== "annule").length,
  }), [plannings, orderDeadlineMap]);

  if (sortedPlannings.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <p className="text-sm">Aucune tâche planifiée sur cette période.</p>
        <p className="text-xs mt-1">Utilisez « Planifier » pour ajouter des tâches au diagramme.</p>
      </Card>
    );
  }

  const TOTAL_WIDTH = Math.max(800, ticks.length * 60);

  return (
    <div className="space-y-3">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1">
        <MetricChip label="Tâches" value={stats.total} />
        <MetricChip label="En retard" value={stats.atRisk} alert={stats.atRisk > 0} />
        <MetricChip label="Chaînes liées" value={stats.chains} icon={Link2} />
        <MetricChip label="Jours" value={ticks.length} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: TOTAL_WIDTH + 340 }}>
            {/* ── Header ── */}
            <div className="flex border-b bg-muted/40">
              {/* Left panel header */}
              <div className="w-[340px] flex-shrink-0 p-2 border-r">
                <span className="text-xs font-semibold text-muted-foreground">Tâche — Planification</span>
              </div>
              {/* Timeline header */}
              <div className="flex-1 relative overflow-hidden">
                {ticks.map((tick, i) => (
                  <div
                    key={i}
                    className={`absolute top-0 bottom-0 flex flex-col justify-center items-center text-center border-r ${
                      tick.isToday ? "bg-primary/10" : ""
                    }`}
                    style={{ left: pctForTime(tick.startMs, rangeStartMs, rangeEndMs) + "%", width: (tick.endMs - tick.startMs) / totalMs * 100 + "%" }}
                  >
                    <span className={`text-[10px] font-semibold ${tick.isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {tick.label}
                    </span>
                    {scale === "semaine" && (
                      <span className="text-[9px] text-muted-foreground">{tick.sub}</span>
                    )}
                  </div>
                ))}
                {/* Today line */}
                {isTodayInRange && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                    style={{ left: todayPct + "%" }}
                    title="Aujourd'hui"
                  />
                )}
              </div>
            </div>

            {/* ── Task rows ── */}
            <div className="relative">
              {sortedPlannings.map((p, rowIdx) => {
                const startMs = moment(p.start_datetime).valueOf();
                const endMs = moment(p.end_datetime).valueOf();
                const leftPct = pctForTime(startMs, rangeStartMs, rangeEndMs);
                const naturalWidth = (endMs - startMs) / totalMs * 100;
                // Keep bars entirely inside the selected period, even for
                // tasks that start before or end after the displayed range.
                const widthPct = Math.max(0.8, Math.min(100 - leftPct, naturalWidth));

                const deadline = orderDeadlineMap[p.production_order_id];
                const isLate =
                  p.statut === "en_retard" ||
                  (deadline && moment(p.end_datetime).isAfter(deadline) && p.statut !== "termine");

                const dur = moment.duration(moment(p.end_datetime).diff(moment(p.start_datetime)));
                const durLabel =
                  dur.asDays() >= 1
                    ? `${Math.floor(dur.asDays())}j ${dur.hours()}h`
                    : `${dur.hours()}h ${dur.minutes()}m`;

                return (
                  <div
                    key={p.id}
                    className="flex border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* ─ Left panel ─ */}
                    <div className="w-[340px] flex-shrink-0 flex items-center gap-2 px-3 py-2 border-r">
                      {/* Status dot + expand */}
                      <button
                        onClick={() => onSelectPlanning?.(p)}
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: STATUT_BAR[p.statut]?.split(" ")[0] || "#F59E0B" }}
                        title={STATUT_LABEL[p.statut] || p.statut}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[p.priorite] || PRIORITY_DOT.normale}`} />
                          <span className="text-xs font-semibold truncate" title={p.numero_ordre}>
                            {p.numero_ordre || "—"}
                          </span>
                          <StatutBadge statut={p.statut} />
                          {isLate && (
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {p.produit || p.machine || "—"}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-[10px] font-medium">{durLabel}</div>
                        <div className="text-[9px] text-muted-foreground">
                          {moment(p.start_datetime).format("DD/MM HH:mm")}
                        </div>
                      </div>
                    </div>

                    {/* ─ Right timeline ─ */}
                    <div className="flex-1 relative" style={{ height: ROW_H }}>
                      {/* Weekend / today column shading for week view */}
                      {scale === "semaine" && ticks.map((tick, i) => {
                        const isWeekend = tick.label.startsWith("sam") || tick.label.startsWith("dim");
                        if (!isWeekend && !tick.isToday) return null;
                        return (
                          <div
                            key={i}
                            className={`absolute top-0 bottom-0 ${tick.isToday ? "bg-primary/5" : "bg-gray-50 dark:bg-gray-800/30"}`}
                            style={{
                              left: pctForTime(tick.startMs, rangeStartMs, rangeEndMs) + "%",
                              width: (tick.endMs - tick.startMs) / totalMs * 100 + "%",
                            }}
                          />
                        );
                      })}

                      {/* Deadline vertical marker */}
                      {deadline && (
                        <div
                          className="absolute top-0 bottom-0 w-px border-l border-dashed border-red-400 z-10 pointer-events-none"
                          style={{ left: pctForTime(deadline.valueOf(), rangeStartMs, rangeEndMs) + "%" }}
                          title={`Deadline: ${deadline.format("DD/MM/YYYY")}`}
                        />
                      )}

                      {/* Gantt bar */}
                      <button
                        onClick={() => onSelectPlanning?.(p)}
                        className={`absolute rounded-md border text-left px-2 py-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all z-20 ${STATUT_BAR[p.statut] || STATUT_BAR.planifie} ${p.priorite === "haute" ? "ring-2 ring-red-400" : ""}`}
                        style={{
                          left: leftPct + "%",
                          width: widthPct + "%",
                          minWidth: 20,
                          top: 6,
                          height: ROW_H - 12,
                        }}
                        title={`${p.numero_ordre} — ${p.produit}\n${moment(p.start_datetime).format("DD/MM HH:mm")} → ${moment(p.end_datetime).format("HH:mm")}${deadline ? `\nDeadline: ${deadline.format("DD/MM/YYYY")}` : ""}\n${p.machine ? `Machine: ${p.machine}` : ""}`}
                      >
                        <div className="text-[9px] font-bold text-white truncate leading-tight">
                          {p.numero_ordre}
                        </div>
                        {widthPct > 5 && (
                          <div className="text-[8px] text-white/90 truncate">{p.produit}</div>
                        )}
                        {widthPct > 8 && (
                          <div className="text-[8px] text-white/75 truncate">{p.machine || p.ligne_production}</div>
                        )}
                      </button>

                      {/* Today line */}
                      {isTodayInRange && rowIdx === 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-primary z-30 pointer-events-none"
                          style={{ left: todayPct + "%" }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Legend row */}
              <div className="flex items-center gap-3 px-4 py-2 border-t bg-muted/20 text-[10px]">
                <span className="text-muted-foreground font-medium mr-2">Statut :</span>
                {[
                  ["Planifié", "bg-amber-400"],
                  ["En cours", "bg-blue-500"],
                  ["Terminé", "bg-green-500"],
                  ["Annulé", "bg-gray-300"],
                  ["En retard", "bg-orange-500"],
                ].map(([label, cls]) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className={`w-3 h-2 rounded-sm ${cls}`} />
                    {label}
                  </span>
                ))}
                <span className="flex items-center gap-1 ml-2">
                  <span className="w-4 border-t border-dashed border-red-400" />
                  Deadline
                </span>
                <span className="flex items-center gap-1 ml-2">
                  <span className="w-4 border-t border-primary" />
                  Aujourd'hui
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
