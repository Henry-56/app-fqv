"use client";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoEqualEarth } from "d3-geo";
import { Arc, NodeConfig, NodeState } from "@/lib/types";

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

type Props = {
  nodes: NodeConfig[];
  nodeStates: Record<string, NodeState>;
  arcs: Arc[];
};

export default function WorldMap({ nodes, nodeStates, arcs }: Props) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700 text-xs text-slate-400 font-medium flex items-center justify-between">
        <span>🌐 Topología de Red — Replicación Multicontinente</span>
        <span className="text-slate-600">{arcs.length > 0 ? `${arcs.length} paquete(s) en tránsito` : "En espera"}</span>
      </div>
      <div className="flex-1">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 160, center: [0, 0] }}
          width={W}
          height={H}
          style={{ width: "100%", height: "auto", background: "#0f172a" }}
        >
          <defs>
            <filter id="arcGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="nodeGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
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
                    hover:   { outline: "none", fill: "#263548" },
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
                <line
                  key={`${a.id}-${b.id}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#1e3a5f"
                  strokeWidth={0.7}
                  strokeDasharray="4,6"
                />
              );
            })
          )}

          {/* Arcos animados activos */}
          {arcs.map(arc => (
            <ArcPath key={arc.id} arc={arc} nodes={nodes} />
          ))}

          {/* Marcadores de nodos */}
          {nodes.map(node => {
            const st = nodeStates[node.id];
            return (
              <Marker key={node.id} coordinates={node.coords}>
                <g filter="url(#nodeGlow)">
                  {st.online && (
                    <circle r={14} fill={node.color} opacity={0.18}>
                      <animate attributeName="r" values="8;18;8" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.25;0;0.25" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    r={7}
                    fill={st.online ? node.color : "#475569"}
                    stroke={st.online ? "white" : "#64748b"}
                    strokeWidth={1.5}
                  />
                </g>
                <text
                  y={-13}
                  textAnchor="middle"
                  fill="white"
                  fontSize={9}
                  fontWeight={600}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.bandera} {node.nombre}
                </text>
                {!st.online && (
                  <text y={14} textAnchor="middle" fill="#ef4444" fontSize={7} fontWeight={600}>
                    OFFLINE
                  </text>
                )}
              </Marker>
            );
          })}
        </ComposableMap>
      </div>
    </div>
  );
}
