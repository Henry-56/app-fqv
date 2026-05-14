import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { NODE_CONFIG, SyncEvent, UserQuery } from "@/lib/types";

const OP_LABEL: Record<string, string> = { insert: "INS", update: "UPD", delete: "DEL", conflict: "CON" };
const OP_COLOR: Record<string, string> = {
  insert:   "text-blue-400 bg-blue-500/10",
  update:   "text-yellow-400 bg-yellow-500/10",
  delete:   "text-red-400 bg-red-500/10",
  conflict: "text-orange-400 bg-orange-500/10",
};

export default function SyncLog({ events, queries = [] }: { events: SyncEvent[]; queries?: UserQuery[] }) {
  const pending = events.filter(e => e.status === "sync").length;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col min-h-0">
      <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-white">📋 Log de Sincronización</span>
        {pending > 0 && (
          <span className="text-[10px] text-yellow-400 flex items-center gap-1">
            <Loader2 size={9} className="animate-spin" />{pending} en tránsito
          </span>
        )}
      </div>
      <div className="overflow-y-auto p-2 space-y-1 max-h-56">
        {/* Consultas de usuario */}
        {queries.map(q => {
          const node = NODE_CONFIG.find(n => n.id === q.targetNode)!;
          return (
            <div key={q.id} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${
              q.status === "querying"
                ? "bg-yellow-500/5 border-yellow-500/20"
                : "bg-green-500/5 border-green-500/20"
            }`}>
              {q.status === "querying"
                ? <Loader2 size={10} className="text-yellow-400 animate-spin shrink-0" />
                : <Check size={10} className="text-green-400 shrink-0" />
              }
              <span className="text-[9px] font-bold font-mono px-1 py-0.5 rounded text-yellow-300 bg-yellow-500/10 shrink-0">
                QRY
              </span>
              <span className="flex-1 truncate">
                <span className="text-yellow-200">👤 Usuario</span>
                <span className="text-slate-500 mx-1">→</span>
                <span style={{ color: node.color }}>{node.bandera} {node.nombre}</span>
                <span className="text-slate-600 mx-1">·</span>
                <span className="font-mono text-slate-400">{q.distanceKm.toLocaleString()} km</span>
              </span>
              <span className={`shrink-0 font-mono text-[10px] font-medium ${
                q.status === "querying" ? "text-yellow-400" : "text-green-400"
              }`}>
                {q.status === "querying" ? "···" : `${q.latencyMs}ms`}
              </span>
            </div>
          );
        })}

        {events.length === 0 && queries.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-6">Inserta un registro o simula una consulta</p>
        )}
        {events.map(ev => {
          const fromNode = NODE_CONFIG.find(n => n.id === ev.from)!;
          const toNode   = NODE_CONFIG.find(n => n.id === ev.to)!;
          return (
            <div
              key={ev.id}
              className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${
                ev.status === "ok"       ? "bg-green-500/5 border-green-500/20"   :
                ev.status === "fail"     ? "bg-red-500/5 border-red-500/20"       :
                ev.status === "conflict" ? "bg-orange-500/5 border-orange-500/20" :
                                          "bg-blue-500/5 border-blue-500/20"
              }`}
            >
              {ev.status === "sync"     && <Loader2       size={10} className="text-blue-400 animate-spin shrink-0" />}
              {ev.status === "ok"       && <Check         size={10} className="text-green-400 shrink-0" />}
              {ev.status === "fail"     && <X             size={10} className="text-red-400 shrink-0" />}
              {ev.status === "conflict" && <AlertTriangle size={10} className="text-orange-400 shrink-0" />}

              <span className={`text-[9px] font-bold font-mono px-1 py-0.5 rounded shrink-0 ${OP_COLOR[ev.op]}`}>
                {OP_LABEL[ev.op]}
              </span>

              <span className="flex-1 truncate">
                <span style={{ color: fromNode.color }}>{fromNode.bandera} {fromNode.nombre}</span>
                <span className="text-slate-500 mx-1">→</span>
                <span style={{ color: toNode.color }}>{toNode.bandera} {toNode.nombre}</span>
                <span className="text-slate-600 mx-1">·</span>
                <span className="font-mono text-slate-400">{ev.clave}</span>
              </span>

              <span className={`shrink-0 font-mono text-[10px] font-medium ${
                ev.status === "ok"       ? "text-green-500"  :
                ev.status === "fail"     ? "text-red-500"    :
                ev.status === "conflict" ? "text-orange-400" : "text-blue-400"
              }`}>
                {ev.status === "ok"       ? `${ev.latency}ms`   :
                 ev.status === "fail"     ? "OFFLINE"           :
                 ev.status === "conflict" ? "LWW"               : "···"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
