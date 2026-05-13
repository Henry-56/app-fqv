"use client";
import { useState } from "react";
import { Plus, Zap, ChevronRight } from "lucide-react";
import { NODE_CONFIG, NodeId, NodeState } from "@/lib/types";

type Props = {
  nodeStates: Record<string, NodeState>;
  onInsert: (nodeId: NodeId, clave: string, valor: string) => void;
  onConflict: () => void;
};

export default function ControlPanel({ nodeStates, onInsert, onConflict }: Props) {
  const [tab, setTab]       = useState<"insert" | "conflict">("insert");
  const [clave, setClave]   = useState("");
  const [valor, setValor]   = useState("");
  const [origen, setOrigen] = useState<NodeId>("am");

  const handleInsert = () => {
    if (!clave.trim() || !valor.trim()) return;
    onInsert(origen, clave.trim(), valor.trim());
    setClave("");
    setValor("");
  };

  const onlineCount = NODE_CONFIG.filter(n => nodeStates[n.id].online).length;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <TabBtn active={tab === "insert"} onClick={() => setTab("insert")} color="blue">
          <Plus size={12} /> Insertar
        </TabBtn>
        <TabBtn active={tab === "conflict"} onClick={() => setTab("conflict")} color="orange">
          <Zap size={12} /> Conflicto
        </TabBtn>
      </div>

      <div className="p-4">
        {tab === "insert" ? (
          <div className="space-y-3">
            <Field label="Nodo origen">
              <select
                value={origen}
                onChange={e => setOrigen(e.target.value as NodeId)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {NODE_CONFIG.map(n => (
                  <option key={n.id} value={n.id} disabled={!nodeStates[n.id].online}>
                    {n.bandera} {n.nombre} {!nodeStates[n.id].online ? "(offline)" : `· ${n.lat}ms`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Clave">
              <input
                type="text"
                value={clave}
                onChange={e => setClave(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInsert()}
                placeholder="ej: usuario:042"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </Field>
            <Field label="Valor">
              <input
                type="text"
                value={valor}
                onChange={e => setValor(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInsert()}
                placeholder="ej: juan_garcia"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </Field>
            <button
              onClick={handleInsert}
              disabled={!clave.trim() || !valor.trim()}
              className="w-full py-2.5 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white flex items-center justify-center gap-2"
            >
              Insertar y Replicar <ChevronRight size={14} />
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Se propagará a todos los nodos online según su latencia
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-300 mb-1.5">¿Qué demuestra?</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dos nodos escriben <strong className="text-white">la misma clave</strong> con valores distintos al mismo tiempo.
                Simula una <strong className="text-orange-300">escritura concurrente</strong> y muestra cómo el sistema resuelve
                el conflicto usando <strong className="text-orange-300">Last-Write-Wins (LWW)</strong>: el registro con
                timestamp mayor gana.
              </p>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Nodo A escribe <code className="text-slate-300">conflicto:sync_xxx</code> = valor_A</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span>Nodo B escribe <code className="text-slate-300">conflicto:sync_xxx</code> = valor_B (+50ms)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <span>Convergencia: todos los nodos quedan con valor_B (LWW)</span>
              </div>
            </div>
            <button
              onClick={onConflict}
              disabled={onlineCount < 2}
              className="w-full py-2.5 rounded-lg font-semibold text-sm bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white flex items-center justify-center gap-2"
            >
              <Zap size={14} /> Simular Escritura Concurrente
            </button>
            {onlineCount < 2 && (
              <p className="text-[10px] text-red-400 text-center">Necesitas al menos 2 nodos online</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({
  children,
  active,
  onClick,
  color,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color: "blue" | "orange";
}) {
  const activeClasses = color === "blue"
    ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
    : "text-orange-400 border-b-2 border-orange-400 bg-orange-500/5";

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
        active ? activeClasses : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 uppercase tracking-wide mb-1 block">{label}</label>
      {children}
    </div>
  );
}
