"use client";
import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Database } from "lucide-react";
import {
  NODE_CONFIG, INITIAL_NODE_STATES,
  NodeId, DbRecord, SyncEvent, Arc, NodeState, OpType,
} from "@/lib/types";
import NodeCard from "./NodeCard";
import SyncLog from "./SyncLog";
import ControlPanel from "./ControlPanel";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

export default function Dashboard() {
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>(INITIAL_NODE_STATES);
  const [events,     setEvents]     = useState<SyncEvent[]>([]);
  const [arcs,       setArcs]       = useState<Arc[]>([]);
  const counter = useRef(0);

  // ── Arco animado en el mapa ────────────────────────────────────────────
  const addArc = useCallback((from: NodeId, to: NodeId, duration: number) => {
    const color  = NODE_CONFIG.find(n => n.id === from)!.color;
    const arcId  = `arc-${counter.current++}`;
    setArcs(prev => [...prev, { id: arcId, from, to, color, duration }]);
    setTimeout(() => setArcs(prev => prev.filter(a => a.id !== arcId)), duration + 600);
  }, []);

  // ── Propagación genérica a nodos online ───────────────────────────────
  const propagate = useCallback(
    (
      rec: DbRecord,
      op: OpType,
      fromId: string,
      applyFn: (state: NodeState, rec: DbRecord) => NodeState
    ) => {
      NODE_CONFIG.filter(n => n.id !== fromId).forEach(target => {
        const eid = `e${counter.current++}`;

        if (!nodeStates[target.id].online) {
          setEvents(prev => [
            { id: eid, from: fromId as NodeId, to: target.id, clave: rec.clave, latency: target.lat, ts: Date.now(), status: "fail", op },
            ...prev.slice(0, 49),
          ]);
          return;
        }

        setEvents(prev => [
          { id: eid, from: fromId as NodeId, to: target.id, clave: rec.clave, latency: target.lat, ts: Date.now(), status: "sync", op },
          ...prev.slice(0, 49),
        ]);
        addArc(fromId as NodeId, target.id, target.lat);

        setTimeout(() => {
          setNodeStates(prev => ({ ...prev, [target.id]: applyFn(prev[target.id], rec) }));
          setEvents(prev => prev.map(e => e.id === eid ? { ...e, status: "ok" } : e));
        }, target.lat);
      });
    },
    [nodeStates, addArc]
  );

  // ── INSERT ─────────────────────────────────────────────────────────────
  const insertRecord = useCallback((nodeId: NodeId, clave: string, valor: string) => {
    const rec: DbRecord = { id: `r${Date.now()}`, clave, valor, ts: Date.now(), origen: nodeId };

    setNodeStates(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], records: [rec, ...prev[nodeId].records] },
    }));

    propagate(rec, "insert", nodeId, (state, r) => ({
      ...state,
      records: [r, ...state.records],
    }));
  }, [propagate]);

  // ── UPDATE ─────────────────────────────────────────────────────────────
  const updateRecord = useCallback((nodeId: string, recId: string, newValor: string) => {
    const existing = nodeStates[nodeId].records.find(r => r.id === recId);
    if (!existing) return;
    const updated: DbRecord = { ...existing, valor: newValor, ts: Date.now() };

    setNodeStates(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], records: prev[nodeId].records.map(r => r.id === recId ? updated : r) },
    }));

    propagate(updated, "update", nodeId, (state, r) => ({
      ...state,
      records: state.records.map(x => x.id === r.id ? r : x),
    }));
  }, [nodeStates, propagate]);

  // ── DELETE ─────────────────────────────────────────────────────────────
  const deleteRecord = useCallback((nodeId: string, recId: string) => {
    const rec = nodeStates[nodeId].records.find(r => r.id === recId);
    if (!rec) return;

    setNodeStates(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], records: prev[nodeId].records.filter(r => r.id !== recId) },
    }));

    propagate(rec, "delete", nodeId, (state, r) => ({
      ...state,
      records: state.records.filter(x => x.id !== r.id),
    }));
  }, [nodeStates, propagate]);

  // ── CONFLICTO (escritura concurrente) ─────────────────────────────────
  const simularConflicto = useCallback(() => {
    const online = NODE_CONFIG.filter(n => nodeStates[n.id].online);
    if (online.length < 2) return;

    const [nodeA, nodeB] = online;
    const suffix = Date.now().toString(36).slice(-4);
    const clave  = `conflicto:${suffix}`;
    const now    = Date.now();

    const recA: DbRecord = { id: `ra${now}`,     clave, valor: `val_${nodeA.id}_${Math.floor(Math.random()*99)}`, ts: now,      origen: nodeA.id };
    const recB: DbRecord = { id: `rb${now + 50}`, clave, valor: `val_${nodeB.id}_${Math.floor(Math.random()*99)}`, ts: now + 50, origen: nodeB.id };

    // Ambos nodos escriben su versión localmente
    setNodeStates(prev => ({
      ...prev,
      [nodeA.id]: { ...prev[nodeA.id], records: [recA, ...prev[nodeA.id].records.filter(r => r.clave !== clave)] },
      [nodeB.id]: { ...prev[nodeB.id], records: [recB, ...prev[nodeB.id].records.filter(r => r.clave !== clave)] },
    }));

    // nodeA → resto de nodos
    NODE_CONFIG.filter(n => n.id !== nodeA.id).forEach(target => {
      if (!nodeStates[target.id].online) return;
      const eid = `e${counter.current++}`;
      const isConflictTarget = target.id === nodeB.id;

      setEvents(prev => [
        { id: eid, from: nodeA.id, to: target.id, clave, latency: target.lat, ts: now, status: "sync", op: isConflictTarget ? "conflict" : "insert" },
        ...prev.slice(0, 49),
      ]);
      addArc(nodeA.id, target.id, target.lat);

      setTimeout(() => {
        setNodeStates(prev => {
          const existing = prev[target.id].records.find(r => r.clave === clave);
          const winner   = !existing || recA.ts > existing.ts ? recA : existing;
          return { ...prev, [target.id]: { ...prev[target.id], records: [winner, ...prev[target.id].records.filter(r => r.clave !== clave)] } };
        });
        setEvents(prev => prev.map(e => e.id === eid ? { ...e, status: isConflictTarget ? "conflict" : "ok" } : e));
      }, target.lat);
    });

    // nodeB → resto de nodos (llega 50ms después, gana por LWW)
    NODE_CONFIG.filter(n => n.id !== nodeB.id).forEach(target => {
      if (!nodeStates[target.id].online) return;
      const eid = `e${counter.current++}`;
      const isConflictTarget = target.id === nodeA.id;

      setEvents(prev => [
        { id: eid, from: nodeB.id, to: target.id, clave, latency: target.lat, ts: now + 50, status: "sync", op: isConflictTarget ? "conflict" : "insert" },
        ...prev.slice(0, 49),
      ]);
      addArc(nodeB.id, target.id, target.lat);

      setTimeout(() => {
        setNodeStates(prev => {
          const existing = prev[target.id].records.find(r => r.clave === clave);
          const winner   = !existing || recB.ts > existing.ts ? recB : existing;
          return { ...prev, [target.id]: { ...prev[target.id], records: [winner, ...prev[target.id].records.filter(r => r.clave !== clave)] } };
        });
        setEvents(prev => prev.map(e => e.id === eid ? { ...e, status: isConflictTarget ? "conflict" : "ok" } : e));
      }, target.lat + 50);
    });
  }, [nodeStates, addArc]);

  // ── Toggle nodo online/offline ─────────────────────────────────────────
  const toggleNode = useCallback((id: string) => {
    setNodeStates(prev => ({ ...prev, [id]: { ...prev[id], online: !prev[id].online } }));
  }, []);

  // ── Métricas del header ────────────────────────────────────────────────
  const onlineCount = NODE_CONFIG.filter(n => nodeStates[n.id].online).length;
  const opsOk       = events.filter(e => e.status === "ok").length;
  const conflicts   = events.filter(e => e.status === "conflict").length;
  const avgLat      = opsOk > 0
    ? Math.round(events.filter(e => e.status === "ok").reduce((s, e) => s + e.latency, 0) / opsOk)
    : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 lg:px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <Database className="text-blue-400" size={20} />
              <h1 className="text-base font-bold text-white">BD Distribuida Multicontinente</h1>
            </div>
            <p className="text-[10px] text-slate-500 ml-8">
              Arquitectura distribuida · Sincronización en tiempo real · Consistencia eventual
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Chip label="Nodos activos"    value={`${onlineCount}/4`} color="text-green-400"  />
            <Chip label="Ops completadas"  value={String(opsOk)}      color="text-blue-400"   />
            <Chip label="Latencia prom."   value={avgLat > 0 ? `${avgLat}ms` : "—"} color="text-yellow-400" />
            <Chip label="Conflictos LWW"   value={String(conflicts)}  color="text-orange-400" />
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-auto">
        {/* Mapa + Panel de control */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-3">
            <WorldMap nodes={NODE_CONFIG} nodeStates={nodeStates} arcs={arcs} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            <ControlPanel
              nodeStates={nodeStates}
              onInsert={insertRecord}
              onConflict={simularConflicto}
            />
            <SyncLog events={events} />
          </div>
        </div>

        {/* Tarjetas de nodos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {NODE_CONFIG.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              state={nodeStates[node.id]}
              onToggle={() => toggleNode(node.id)}
              onUpdate={(recId, val) => updateRecord(node.id, recId, val)}
              onDelete={recId => deleteRecord(node.id, recId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-center min-w-[80px]">
      <div className={`font-bold text-sm ${color}`}>{value}</div>
      <div className="text-[9px] text-slate-500 leading-tight">{label}</div>
    </div>
  );
}
