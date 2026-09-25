import { useMemo, useState } from "react";
import type { Order } from "../types";
import { fmtDateTime, lastRepairTime, orderSummary } from "../utils";

interface Props {
  orders: Order[];
  onOpenOrder: (id: string) => void;
}

interface Group {
  key: string;
  name: string;
  phone: string;
  latest: string;
  orders: Order[];
  preferences: string[];
}

function latestOf(o: Order): string {
  return o.damages.reduce<string>(
    (acc, d) => {
      const t = lastRepairTime(d);
      return t > acc ? t : acc;
    },
    o.completedAt ?? o.updatedAt,
  );
}

export default function CustomerPage({ orders, onOpenOrder }: Props) {
  const [q, setQ] = useState("");

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const o of orders) {
      const name = o.customerName.trim();
      const phone = o.customerPhone.trim();
      if (!name && !phone) continue;
      const key = `${name}|${phone}`;
      const g = map.get(key) ?? {
        key,
        name: name || "未留名",
        phone,
        latest: "",
        orders: [],
        preferences: [],
      };
      g.orders.push(o);
      const t = latestOf(o);
      if (t > g.latest) g.latest = t;
      if (o.preference.trim() && !g.preferences.includes(o.preference.trim())) {
        g.preferences.unshift(o.preference.trim());
      }
      map.set(key, g);
    }
    const list = [...map.values()];
    list.forEach((g) => g.orders.sort((a, b) => latestOf(b).localeCompare(latestOf(a))));
    list.sort((a, b) => b.latest.localeCompare(a.latest));
    const kw = q.trim().toLowerCase();
    if (!kw) return list;
    return list.filter(
      (g) =>
        g.name.toLowerCase().includes(kw) ||
        g.phone.toLowerCase().includes(kw) ||
        g.orders.some(
          (o) =>
            o.brand.toLowerCase().includes(kw) ||
            o.shape.toLowerCase().includes(kw) ||
            orderSummary(o).toLowerCase().includes(kw),
        ),
    );
  }, [orders, q]);

  return (
    <div className="customers">
      <div className="customer-toolbar panel">
        <div>
          <p className="eyebrow">客户页</p>
          <h2>客户历史维护记录</h2>
          <p className="soft-note">
            按客户最近一次维护时间排序；点开任意旧单，可查看完工当时锁定的雪板参数。
          </p>
        </div>
        <input
          className="customer-search"
          placeholder="搜索姓名 / 电话 / 雪板品牌"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {groups.length === 0 && (
        <p className="empty-hint big">还没有登记客户信息的工单。</p>
      )}

      <div className="customer-grid">
        {groups.map((g) => (
          <article key={g.key} className="panel customer-card">
            <header>
              <div>
                <h3>{g.name}</h3>
                <span>{g.phone || "未留电话"}</span>
              </div>
              <div className="customer-latest">
                <small>最近维护</small>
                <b>{fmtDateTime(g.latest)}</b>
              </div>
            </header>
            {g.preferences.length > 0 && (
              <p className="customer-pref" title={g.preferences.join("\n")}>
                偏好：{g.preferences[0]}
                {g.preferences.length > 1 && `（另有 ${g.preferences.length - 1} 条）`}
              </p>
            )}
            <ul className="history-list">
              {g.orders.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => onOpenOrder(o.id)}>
                    <time>{fmtDateTime(latestOf(o))}</time>
                    <span className="hist-main">
                      <b>{orderSummary(o) || "未填写雪板信息"}</b>
                      <small>
                        {o.id} · 刃角 {o.sideEdgeDeg || "?"}°/{o.baseEdgeDeg || "?"}° ·{" "}
                        {o.waxType || "未打蜡"}
                        {o.waxType === "其他" && o.waxOther ? `（${o.waxOther}）` : ""}
                      </small>
                    </span>
                    <span className={`status-pill st-${o.status}`}>
                      {o.status === "pending"
                        ? "待维护"
                        : o.status === "ready"
                          ? "待交付"
                          : "已完成"}
                    </span>
                    <span className="hist-go">查看当时参数 →</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
