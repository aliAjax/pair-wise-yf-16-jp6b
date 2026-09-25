export type Status = "pending" | "ready" | "done";
export type DamageKind = "base" | "edge"; // 底板划痕 | 边刃伤

export interface Repair {
  id: string;
  /** ISO 时间，每次修补各自保留 */
  time: string;
  /** 修补位置（必填，完工校验） */
  location: string;
  note: string;
}

export interface Damage {
  id: string;
  /** 工单内损伤点序号 #1 #2 ... */
  no: number;
  kind: DamageKind;
  /** 底板图坐标，viewBox: x 0..100，y 0..360 */
  x: number;
  y: number;
  description: string;
  repairs: Repair[];
}

export interface SnapshotRepair {
  time: string;
  location: string;
  note: string;
}

export interface SnapshotDamage {
  no: number;
  kind: DamageKind;
  descriptor: string;
  description: string;
  repairs: SnapshotRepair[];
}

/** 完工瞬间锁定的参数快照，旧单随时可查「当时参数」 */
export interface Snapshot {
  at: string;
  brand: string;
  lengthCm: string;
  shape: string;
  sideEdgeDeg: string;
  baseEdgeDeg: string;
  waxType: string;
  waxOther: string;
  preference: string;
  damages: SnapshotDamage[];
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
  customerName: string;
  customerPhone: string;
  brand: string;
  lengthCm: string;
  shape: string;
  sideEdgeDeg: string;
  baseEdgeDeg: string;
  waxType: string;
  waxOther: string;
  preference: string;
  damages: Damage[];
  completedAt?: string;
  deliveredAt?: string;
  snapshot?: Snapshot;
}

export interface Conflict {
  damageId: string | null;
  message: string;
}

export interface UiState {
  tab: "orders" | "customers";
  filter: Status | "all";
  query: string;
  openOrderId: string | null;
}
