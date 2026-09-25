export type DamageType = "scratch" | "edge";
export type Status = "pending" | "delivering" | "done";

export interface Repair {
  id: string;
  /** 修补时间 ISO 字符串 */
  time: string;
  /** 修补位置/工艺描述 */
  position: string;
  note: string;
}

export interface Damage {
  id: string;
  /** 底板图 viewBox 坐标 (0-220, 0-640) */
  x: number;
  y: number;
  type: DamageType;
  repairs: Repair[];
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  customerName: string;
  customerPhone: string;
  brand: string;
  length: string;
  boardType: string;
  /** 底刃角度，如 "1" */
  edgeBase: string;
  /** 侧刃角度，如 "88" */
  edgeSide: string;
  waxType: string;
  preference: string;
  status: Status;
  damages: Damage[];
}
