import type { Damage, Order, UiState } from "./types";
import { STORAGE_KEY, UI_KEY, uid } from "./utils";

export function loadOrders(): Order[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as Order[]) : null;
  } catch {
    return null;
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    /* 存储已满或隐私模式，忽略 */
  }
}

export function loadUi(): Partial<UiState> {
  try {
    const raw = localStorage.getItem(UI_KEY);
    return raw ? (JSON.parse(raw) as Partial<UiState>) : {};
  } catch {
    return {};
  }
}

export function saveUi(ui: UiState): void {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify(ui));
  } catch {
    /* ignore */
  }
}

function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoAt(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function damage(
  partial: Omit<Damage, "id" | "repairs"> & { repairs?: Damage["repairs"] },
): Damage {
  return { id: uid("dmg"), repairs: [], ...partial };
}

/** 首次打开时的示例台账；之后完全以 localStorage 为准 */
export function seedOrders(): Order[] {
  const now = new Date().toISOString();

  const d1 = damage({
    no: 1,
    kind: "base",
    x: 42,
    y: 118,
    description: "板头底板深划痕，约 3cm",
    repairs: [
      {
        id: uid("rep"),
        time: isoAt(0, 9, 20),
        location: "板头底板 · 距板头 33% 处",
        note: "P-Tex 填补后刮平",
      },
      {
        id: uid("rep"),
        time: isoAt(0, 10, 5),
        location: "板头底板 · 距板头 33% 处",
        note: "复查补蜡，表面已平整",
      },
    ],
  });
  const o1: Order = {
    id: "WB-" + new Date(now).getFullYear() + "-0106",
    createdAt: isoAt(1, 16, 30),
    updatedAt: isoAt(0, 10, 5),
    status: "pending",
    customerName: "陈默",
    customerPhone: "138****6021",
    brand: "Burton Custom",
    lengthCm: "156",
    shape: "全地域",
    sideEdgeDeg: "88",
    baseEdgeDeg: "1",
    waxType: "低温蜡",
    waxOther: "",
    preference: "喜欢刻滑，希望侧刃咬雪强一些",
    damages: [d1],
  };

  const d2 = damage({
    no: 1,
    kind: "edge",
    x: 12,
    y: 190,
    description: "板腰左侧刃磕伤，有小缺口",
    repairs: [
      {
        id: uid("rep"),
        time: isoAt(2, 14, 40),
        location: "板腰左侧刃 · 距板头 53% 处",
        note: "金刚石锉修形，底刃 0.75°",
      },
    ],
  });
  const completedAt2 = isoAt(2, 16, 0);
  const o2: Order = {
    id: "WB-" + new Date(now).getFullYear() + "-0112",
    createdAt: isoAt(2, 9, 0),
    updatedAt: isoAt(1, 11, 0),
    status: "ready",
    customerName: "李棠",
    customerPhone: "139****7745",
    brand: "F2 Silberpfeil",
    lengthCm: "165",
    shape: "竞速板",
    sideEdgeDeg: "87",
    baseEdgeDeg: "0.75",
    waxType: "石墨蜡",
    waxOther: "",
    preference: "竞速用，弱底刃角度",
    damages: [d2],
    completedAt: completedAt2,
    snapshot: {
      at: completedAt2,
      brand: "F2 Silberpfeil",
      lengthCm: "165",
      shape: "竞速板",
      sideEdgeDeg: "87",
      baseEdgeDeg: "0.75",
      waxType: "石墨蜡",
      waxOther: "",
      preference: "竞速用，弱底刃角度",
      damages: [
        {
          no: 1,
          kind: "edge",
          descriptor: "边刃伤 #1（板腰左侧刃 · 距板头 53% 处）",
          description: "板腰左侧刃磕伤，有小缺口",
          repairs: [
            {
              time: isoAt(2, 14, 40),
              location: "板腰左侧刃 · 距板头 53% 处",
              note: "金刚石锉修形，底刃 0.75°",
            },
          ],
        },
      ],
    },
  };

  const d3 = damage({
    no: 1,
    kind: "base",
    x: 55,
    y: 300,
    description: "板尾底板烧板，蜡层脱落",
    repairs: [
      {
        id: uid("rep"),
        time: isoAt(10, 15, 0),
        location: "板尾底板 · 距板头 83% 处",
        note: "清洁后热打蜡",
      },
    ],
  });
  const completedAt3 = isoAt(10, 16, 30);
  const o3: Order = {
    id: "WB-" + new Date(now).getFullYear() + "-0118",
    createdAt: isoAt(11, 10, 0),
    updatedAt: isoAt(9, 18, 0),
    status: "done",
    customerName: "王野",
    customerPhone: "137****2290",
    brand: "Jones Hovercraft",
    lengthCm: "158",
    shape: "粉雪板",
    sideEdgeDeg: "89",
    baseEdgeDeg: "1",
    waxType: "全温蜡",
    waxOther: "",
    preference: "粉雪为主，刃不要太锋利",
    damages: [d3],
    completedAt: completedAt3,
    deliveredAt: isoAt(9, 18, 0),
    snapshot: {
      at: completedAt3,
      brand: "Jones Hovercraft",
      lengthCm: "158",
      shape: "粉雪板",
      sideEdgeDeg: "89",
      baseEdgeDeg: "1",
      waxType: "全温蜡",
      waxOther: "",
      preference: "粉雪为主，刃不要太锋利",
      damages: [
        {
          no: 1,
          kind: "base",
          descriptor: "底板划痕 #1（板尾底板 · 距板头 83% 处）",
          description: "板尾底板烧板，蜡层脱落",
          repairs: [
            {
              time: isoAt(10, 15, 0),
              location: "板尾底板 · 距板头 83% 处",
              note: "清洁后热打蜡",
            },
          ],
        },
      ],
    },
  };

  // 王野的第二次到店，用于演示客户页按最近维护时间排序
  const o4: Order = {
    id: "WB-" + new Date(now).getFullYear() + "-0125",
    createdAt: isoAt(4, 9, 20),
    updatedAt: isoAt(3, 17, 0),
    status: "done",
    customerName: "王野",
    customerPhone: "137****2290",
    brand: "Nitro Team",
    lengthCm: "155",
    shape: "公园板",
    sideEdgeDeg: "88",
    baseEdgeDeg: "1",
    waxType: "温雪蜡",
    waxOther: "",
    preference: "公园跳台，边刃圆角处理",
    damages: [],
    completedAt: isoAt(3, 16, 30),
    deliveredAt: isoAt(3, 17, 0),
    snapshot: {
      at: isoAt(3, 16, 30),
      brand: "Nitro Team",
      lengthCm: "155",
      shape: "公园板",
      sideEdgeDeg: "88",
      baseEdgeDeg: "1",
      waxType: "温雪蜡",
      waxOther: "",
      preference: "公园跳台，边刃圆角处理",
      damages: [],
    },
  };

  return [o1, o2, o4, o3];
}
