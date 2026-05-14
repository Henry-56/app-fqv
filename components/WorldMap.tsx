"use client";
import { useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoEqualEarth } from "d3-geo";
import { Arc, GeoArc, NodeConfig, NodeState, UserQuery } from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const W = 800;
const H = 420;

const proj = geoEqualEarth().scale(160).translate([W / 2, H / 2]);

function getXY(coords: [number, number]): [number, number] {
  const p = proj(coords);
  return p ? [p[0], p[1]] : [W / 2, H / 2];
}

function ArcPath({ arc, nodes }: { arc: Arc; nodes: NodeConfig[] }) {
  const from = nodes.find(n => n.id === arc.from)!;
  const to   = nodes.find(n => n.id === arc.to)!;
  const [x1, y1] = getXY(from.coords);
  const [x2, y2] = getXY(to.coords);
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 65;
  const d  = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
  return (
    <g>
      <path d={d} fill="none" stroke={arc.color} strokeWidth={1.5} strokeOpacity={0.55} strokeDasharray="5,4" />
      <circle r={5} fill={arc.color} filter="url(#arcGlow)">
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore — animateMotion is valid SVG */}
        <animateMotion dur={`${arc.duration / 1000}s`} fill="freeze" path={d} />
      </circle>
    </g>
  );
}

function GeoArcPath({ arc }: { arc: GeoArc }) {
  const [x1, y1] = getXY(arc.fromCoords);
  const [x2, y2] = getXY(arc.toCoords);
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 55;
  const d  = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
  return (
    <g>
      <path
        d={d} fill="none"
        stroke={arc.color}
        strokeWidth={2}
        strokeOpacity={0.85}
        strokeDasharray={arc.returning ? undefined : "6,4"}
      />
      <circle r={4.5} fill={arc.color} filter="url(#arcGlow)">
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore — animateMotion is valid SVG */}
        <animateMotion dur={`${arc.duration / 1000}s`} fill="freeze" path={d} />
      </circle>
    </g>
  );
}

type Props = {
  nodes: NodeConfig[];
  nodeStates: Record<string, NodeState>;
  arcs: Arc[];
  geoArcs?: GeoArc[];
  activeQueries?: UserQuery[];
  queryMode?: boolean;
  onToggleQueryMode?: () => void;
  onMapClick?: (coords: [number, number]) => void;
};

export default function WorldMap({
  nodes, nodeStates, arcs,
  geoArcs = [], activeQueries = [],
  queryMode, onToggleQueryMode, onMapClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!queryMode || !onMapClick || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const svgY = ((e.clientY - rect.top) / rect.height) * H;
    const geo = proj.invert?.([svgX, svgY]);
    if (geo) onMapClick(geo as [number, number]);
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700 text-xs font-medium flex items-center justify-between gap-2">
        <span className="text-slate-400">🌐 Topología de Red — Replicación Multicontinente</span>
        <div className="flex items-center gap-2 shrink-0">
          {queryMode
            ? <span className="text-yellow-400 animate-pulse text-[10px]">📍 Clic en cualquier punto del mapa</span>
            : <span className="text-slate-600 text-[10px]">
                {arcs.length > 0 ? `${arcs.length} paquete(s) en tránsito` : "En espera"}
              </span>
          }
          {onToggleQueryMode && (
            <button
              onClick={e => { e.stopPropagation(); onToggleQueryMode(); }}
              className={`px-2.5 py-1 rounded border text-[10px] font-semibold transition-colors ${
                queryMode
                  ? "border-yellow-500/60 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                  : "border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
              }`}
            >
              {queryMode ? "✕ Cancelar" : "🔍 Simular Consulta"}
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1"
        onClick={handleClick}
        style={{ cursor: queryMode ? "crosshair" : "default" }}
      >
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 160, center: [0, 0] }}
          width={W}
          height={H}
          style={{ width: "100%", height: "auto", background: "#0f172a", display: "block" }}
        >
          <defs>
            <filter id="arcGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="nodeGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="userGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.3}
                  style={{
                    default: { outline: "none" },
                    hover:   { outline: "none", fill: queryMode ? "#1e293b" : "#263548" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Líneas de red estáticas */}
          {nodes.flatMap((a, i) =>
            nodes.slice(i + 1).map(b => {
              const [x1, y1] = getXY(a.coords);
              const [x2, y2] = getXY(b.coords);
              return (
                <line key={`${a.id}-${b.id}`} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#1e3a5f" strokeWidth={0.7} strokeDasharray="4,6" />
              );
            })
          )}

          {/* Arcos de sincronización nodo→nodo */}
          {arcs.map(arc => <ArcPath key={arc.id} arc={arc} nodes={nodes} />)}

          {/* Arcos de consulta usuario→nodo (amarillo dashed) y respuesta nodo→usuario (verde sólido) */}
          {geoArcs.map(arc => <GeoArcPath key={arc.id} arc={arc} />)}

          {/* Marcadores de nodos */}
          {nodes.map(node => {
            const st = nodeStates[node.id];
            const isTarget = activeQueries.some(q => q.targetNode === node.id && q.status === "querying");
            return (
              <Marker key={node.id} coordinates={node.coords}>
                <g filter="url(#nodeGlow)">
                  {st.online && (
                    <circle r={14} fill={node.color} opacity={0.18}>
                      <animate attributeName="r" values="8;18;8" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.25;0;0.25" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isTarget && (
                    <circle r={12} fill={node.color} opacity={0}>
                      <animate attributeName="r" values="10;30;10" dur="0.7s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="0.7s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    r={7}
                    fill={st.online ? node.color : "#475569"}
                    stroke={isTarget ? "white" : (st.online ? "white" : "#64748b")}
                    strokeWidth={isTarget ? 2.5 : 1.5}
                  />
                </g>
                <text y={-13} textAnchor="middle" fill="white" fontSize={9} fontWeight={600}
                  style={{ pointerEvents: "none", userSelect: "none" }}>
                  {node.bandera} {node.nombre}
                </text>
                {!st.online && (
                  <text y={14} textAnchor="middle" fill="#ef4444" fontSize={7} fontWeight={600}>OFFLINE</text>
                )}
              </Marker>
            );
          })}

          {/* Marcador de usuario */}
          {activeQueries.map(q => {
            const [x, y] = getXY(q.coords);
            return (
              <g key={q.id} transform={`translate(${x},${y})`} filter="url(#userGlow)">
                <circle r={5} fill="#facc15" opacity={0.2}>
                  <animate attributeName="r" values="5;18;5" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.35;0;0.35" dur="1.4s" repeatCount="indefinite" />
                </circle>
                <circle r={5} fill="#facc15" stroke="white" strokeWidth={1.5} />
                <text y={-11} textAnchor="middle" fill="#facc15" fontSize={8} fontWeight={700}
                  style={{ pointerEvents: "none", userSelect: "none" }}>
                  👤 Usuario
                </text>
                {q.status === "responded" && (
                  <text y={15} textAnchor="middle" fill="#4ade80" fontSize={7} fontWeight={600}>
                    ✓ {q.latencyMs}ms
                  </text>
                )}
              </g>
            );
          })}
        </ComposableMap>
      </div>
    </div>
  );
}
