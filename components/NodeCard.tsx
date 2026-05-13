"use client";
import { useState } from "react";
import { Wifi, WifiOff, Pencil, Trash2, Check, X, Clock } from "lucide-react";
import { NodeConfig, NodeState } from "@/lib/types";

type Props = {
  node: NodeConfig;
  state: NodeState;
  onToggle: () => void;
  onUpdate: (recId: string, newValor: string) => void;
  onDelete: (recId: string) => void;
};

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("es-PE", { hour12: false });
}

export default function NodeCard({ node, state, onToggle, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  return (
    <div
      className="rounded-xl border bg-slate-800 overflow-hidden transition-all duration-300"
      style={{ borderColor: state.online ? node.color + "66" : "#334155" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-3 transition-colors duration-300"
        style={{ backgroundColor: state.online ? node.color + "18" : "transparent" }}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{node.bandera}</span>
            <span className="font-semibold text-white text-sm">{node.nombre}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs">
            <span className={`flex items-center gap-1 transition-colors ${state.online ? "text-green-400" : "text-red-400"}`}>
              {state.online ? <Wifi size={9} /> : <WifiOff size={9} />}
              {state.online ? "Online" : "Offline"}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500 flex items-center gap-0.5">
              <Clock size={9} />{node.lat}ms
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`text-xs px-2 py-1 rounded border transition-colors ${
            state.online
              ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
              : "border-green-500/40 text-green-400 hover:bg-green-500/10"
          }`}
        >
          {state.online ? "Apagar" : "Activar"}
        </button>
      </div>

      {/* Records table */}
      <div className="px-3 py-2">
        <div className="text-xs text-slate-500 mb-1.5 flex justify-between">
          <span className="uppercase tracking-wide text-[10px]">Registros</span>
          <span style={{ color: node.color }} className="font-semibold">{state.records.length}</span>
        </div>
        <div className="space-y-0.5 max-h-44 overflow-y-auto pr-0.5">
          {state.records.slice(0, 12).map(r => (
            <div key={r.id} className="text-xs py-1 border-b border-slate-700/40 last:border-0">
              {editingId === r.id ? (
                <div className="flex items-center gap-1">
                  <span className="font-mono text-slate-400 text-[10px] truncate flex-1">{r.clave}</span>
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { onUpdate(r.id, editValue); setEditingId(null); }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    className="w-24 bg-slate-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-[10px] focus:outline-none"
                  />
                  <button onClick={() => { onUpdate(r.id, editValue); setEditingId(null); }} className="text-green-400 hover:text-green-300 transition-colors">
                    <Check size={10} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-300 transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center group/row gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-slate-300 truncate text-[11px]">{r.clave}</div>
                    <div className="text-slate-500 truncate text-[10px]">{r.valor}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-slate-600 text-[9px]" suppressHydrationWarning>
                      {fmtTime(r.ts)}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(r.id); setEditValue(r.valor); }}
                        className="text-blue-400 hover:text-blue-300 p-0.5 rounded hover:bg-blue-500/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={9} />
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-500/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {state.records.length === 0 && (
            <p className="text-slate-600 text-xs text-center py-3">Sin registros</p>
          )}
        </div>
      </div>
    </div>
  );
}
