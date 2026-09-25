import { Order, Status, DamageType } from "./types";

const KEY = "ski-tuning-shop-v1";

export const STATUS_LABEL: Record<Status, string> = {
  pending: "待维护",
  delivering: "待交付",
  done: "已完成",
};

export const DAMAGE_LABEL: Record<DamageType, string> = {
  scratch: "划痕",
  edge: "边刃伤",
};

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const fmt = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

/** Date -> datetime-local 输入框值 */
export const toInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
};

export const customerKey = (o: Order) =>
  `${o.customerName.trim()}|${o.customerPhone.trim()}`;

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(KEY, JSON.stringify(orders));
}

/**
 * 完工校验：
 * 1. 损伤点没有任何修补记录，或修补记录未填修补位置 -> 拦截
 * 2. 损伤点最后一次修补时间晚于完工时间 -> 拦截
 */
export function validateCompletion(order: Order, completedAt: string): string[] {
  const conflicts: string[] = [];
  const doneTs = new Date(completedAt).getTime();
  order.damages.forEach((d, i) => {
    const label = `损伤点 #${i + 1}（${DAMAGE_LABEL[d.type]}）`;
    if (d.repairs.length === 0) {
      conflicts.push(`${label}：尚未填写任何修补记录，缺少修补位置`);
      return;
    }
    if (d.repairs.some((r) => !r.position.trim())) {
      conflicts.push(`${label}：存在未填写修补位置的修补记录`);
    }
    const last = d.repairs.reduce((a, b) => (a.time >= b.time ? a : b));
    if (new Date(last.time).getTime() > doneTs) {
      conflicts.push(
        `${label}：最后一次修补 ${fmt(last.time)} 晚于完工时间 ${fmt(completedAt)}`
      );
    }
  });
  return conflicts;
}

/** 首次使用时的示例数据，便于演示 */
export function seedOrders(): Order[] {
  const now = Date.now();
  const ago = (days: number, hours = 0) =>
    new Date(now - days * 86400000 - hours * 3600000).toISOString();
  return [
    {
      id: "ORD-1001",
      createdAt: ago(1, 2),
      updatedAt: ago(0, 3),
      completedAt: null,
      customerName: "张伟",
      customerPhone: "13800001111",
      brand: "Burton",
      length: "156",
      boardType: "全能板",
      edgeBase: "1",
      edgeSide: "88",
      waxType: "全温蜡",
      preference: "偏好弱咬雪，板尾稍软",
      status: "delivering",
      damages: [
        {
          id: uid(),
          x: 96,
          y: 300,
          type: "scratch",
          repairs: [
            {
              id: uid(),
              time: ago(0, 5),
              position: "P-Tex 填补 + 刮平打磨",
              note: "划痕约 8cm，深至芯材边缘",
            },
          ],
        },
        {
          id: uid(),
          x: 158,
          y: 430,
          type: "edge",
          repairs: [],
        },
      ],
    },
    {
      id: "ORD-1002",
      createdAt: ago(3),
      updatedAt: ago(2),
      completedAt: ago(2),
      customerName: "张伟",
      customerPhone: "13800001111",
      brand: "Capita",
      length: "154",
      boardType: "公园板",
      edgeBase: "1",
      edgeSide: "89",
      waxType: "低温蜡",
      preference: "道具区用板，底刃不要太利",
      status: "done",
      damages: [
        {
          id: uid(),
          x: 80,
          y: 200,
          type: "scratch",
          repairs: [
            {
              id: uid(),
              time: ago(2, 4),
              position: "P-Tex 填补",
              note: "首次修补",
            },
            {
              id: uid(),
              time: ago(2, 1),
              position: "二次填补 + 底板结构修复",
              note: "同一位置复划，加深处理",
            },
          ],
        },
      ],
    },
    {
      id: "ORD-1003",
      createdAt: ago(0, 6),
      updatedAt: ago(0, 6),
      completedAt: null,
      customerName: "李娜",
      customerPhone: "13900002222",
      brand: "Jones",
      length: "158",
      boardType: "粉雪板",
      edgeBase: "0.75",
      edgeSide: "89",
      waxType: "竞速氟蜡",
      preference: "上山前取板，需提前电话确认",
      status: "pending",
      damages: [],
    },
  ];
}
