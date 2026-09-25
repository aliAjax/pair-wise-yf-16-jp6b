import type { Conflict, Damage, Order } from "./types";

export const STORAGE_KEY = "ski-tuner.orders.v1";
export const UI_KEY = "ski-tuner.ui.v1";

export const SHAPES = ["全地域", "公园板", "竞速板", "粉雪板", "野雪板"] as const;
export const WAX_TYPES = ["低温蜡", "温雪蜡", "高温蜡", "全温蜡", "石墨蜡"] as const;

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 格式化为 datetime-local 所需的本地时间字符串（含秒） */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function fromLocalInput(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

/** 底板图几何（viewBox 100 x 360，板身在 x 12..88 之间） */
export const BOARD = { W: 100, H: 360, X0: 12, X1: 88 };

export function boardPoint(clientX: number, clientY: number, rect: DOMRect) {
  const rx = (clientX - rect.left) / rect.width;
  const ry = (clientY - rect.top) / rect.height;
  if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return null;
  const rawX = rx * BOARD.W;
  const y = Math.max(0, Math.min(BOARD.H, ry * BOARD.H));
  // 点击超出板身时吸附到最近的边刃线
  const x = Math.max(BOARD.X0, Math.min(BOARD.X1, rawX));
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

/** 纵向位置描述 */
function zoneOf(y: number): string {
  if (y < 120) return "板头";
  if (y > 240) return "板尾";
  return "板腰";
}

function edgeSideOf(x: number): string {
  const mid = (BOARD.X0 + BOARD.X1) / 2;
  return x <= mid ? "左侧刃" : "右侧刃";
}

/** 点选后自动生成的位置描述，可改 */
export function describePoint(kind: Damage["kind"], x: number, y: number): string {
  const zone = zoneOf(y);
  const ratio = y / BOARD.H;
  const along = `${Math.round(ratio * 100)}% 处`;
  return kind === "edge"
    ? `${zone}${edgeSideOf(x)} · 距板头${along}`
    : `${zone}底板 · 距板头${along}`;
}

export function descriptorOf(d: Damage): string {
  return `${d.kind === "edge" ? "边刃伤" : "底板划痕"} #${d.no}（${describePoint(
    d.kind,
    d.x,
    d.y,
  )}）`;
}

export function lastRepairTime(d: Damage): string {
  return d.repairs.reduce<string>((acc, r) => (r.time > acc ? r.time : acc), "");
}

/**
 * 完工校验：
 * 1) 任一损伤点没有修补记录或修补位置为空 → 冲突
 * 2) 最后一次修补时间晚于完工时间 → 冲突
 */
export function findConflicts(order: Order, completedAt: string): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const d of order.damages) {
    if (d.repairs.length === 0) {
      conflicts.push({
        damageId: d.id,
        message: `${descriptorOf(d)} 还没有填写任何修补记录（修补位置必填）。`,
      });
      continue;
    }
    const missing = d.repairs.some((r) => !r.location.trim());
    if (missing) {
      conflicts.push({
        damageId: d.id,
        message: `${descriptorOf(d)} 存在修补位置为空的记录，请补齐后再完工。`,
      });
    }
    const last = lastRepairTime(d);
    if (last && completedAt && last > completedAt) {
      conflicts.push({
        damageId: d.id,
        message: `${descriptorOf(d)} 最后一次修补时间（${fmtDateTime(
          last,
        )}）晚于完工时间（${fmtDateTime(completedAt)}）。`,
      });
    }
  }
  return conflicts;
}

export function orderSummary(o: Order): string {
  return [o.brand, o.lengthCm ? `${o.lengthCm}cm` : "", o.shape].filter(Boolean).join(" · ");
}
