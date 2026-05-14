export type NodeId = "am" | "eu" | "as" | "af";
export type OpType = "insert" | "update" | "delete" | "conflict";
export type SyncStatus = "sync" | "ok" | "fail" | "conflict";

export type DbRecord = {
  id: string;
  clave: string;
  valor: string;
  ts: number;
  origen: string;
};

export type SyncEvent = {
  id: string;
  from: NodeId;
  to: NodeId;
  clave: string;
  latency: number;
  ts: number;
  status: SyncStatus;
  op: OpType;
};

export type Arc = {
  id: string;
  from: NodeId;
  to: NodeId;
  color: string;
  duration: number;
};

export type GeoArc = {
  id: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  color: string;
  duration: number;
  returning: boolean;
};

export type UserQuery = {
  id: string;
  coords: [number, number];
  targetNode: NodeId;
  distanceKm: number;
  latencyMs: number;
  status: "querying" | "responded";
  ts: number;
};

export type NodeState = {
  online: boolean;
  records: DbRecord[];
};

export type NodeConfig = {
  id: NodeId;
  nombre: string;
  bandera: string;
  color: string;
  lat: number;
  coords: [number, number];
};

export const NODE_CONFIG: NodeConfig[] = [
  { id: "am", nombre: "América",  bandera: "🌎", color: "#3b82f6", lat: 45,  coords: [-74.0, 40.7] },
  { id: "eu", nombre: "Europa",   bandera: "🌍", color: "#22c55e", lat: 80,  coords: [2.3,  48.9]  },
  { id: "as", nombre: "Asia",     bandera: "🌏", color: "#f97316", lat: 150, coords: [103.8, 1.3]  },
  { id: "af", nombre: "África",   bandera: "🌍", color: "#a855f7", lat: 220, coords: [36.8, -1.3]  },
];

// Timestamps fijos para evitar hydration mismatch
export const SEED_RECORDS: DbRecord[] = [
  { id: "s1", clave: "usuario:001",  valor: "carlos_lima",  ts: 1747130400000, origen: "am" },
  { id: "s2", clave: "pedido:045",   valor: "completado",   ts: 1747130460000, origen: "eu" },
  { id: "s3", clave: "config:tema",  valor: "oscuro",       ts: 1747130520000, origen: "as" },
];

export const INITIAL_NODE_STATES: Record<string, NodeState> = Object.fromEntries(
  NODE_CONFIG.map(n => [n.id, { online: true, records: [...SEED_RECORDS] }])
);
