import { useMemo, useState } from "react";
import { Order } from "../types";
import { STATUS_LABEL, customerKey, fmt } from "../store";

interface Props {
  orders: Order[];
  onOpenOrder: (id: string) => void;
}

export default function Customers({ orders, onOpenOrder }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders.forEach((o) => {
      const key = customerKey(o);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    });
    return [...map.entries()]
      .map(([key, list]) => {
        const sorted = [...list].sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt)
        );
        return { key, list: sorted, lastTime: sorted[0].updatedAt };
      })
      .sort((a, b) => b.lastTime.localeCompare(a.lastTime));
  }, [orders]);

  const selected = groups.find((g) => g.key === selectedKey);

  if (selected) {
    const [name, phone] = selected.key.split("|");
    return (
      <section className="panel">
        <div className="heading">
          <div>
            <p>客户档案</p>
            <h2>
              {name}
              {phone && <small className="muted"> · {phone}</small>}
            </h2>
          </div>
          <button onClick={() => setSelectedKey(null)}>返回客户列表</button>
        </div>
        <p className="muted">
          共 {selected.list.length} 张工单，按最近维护时间排列。打开旧单可查看当时记录的参数快照。
        </p>
        <div className="records">
          {selected.list.map((o) => (
            <article key={o.id} className="order-card clickable" onClick={() => onOpenOrder(o.id)}>
              <div className="order-main">
                <div className="order-title">
                  <b>{o.id}</b>
                  <span className={`badge ${o.status}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
                <p>
                  {o.brand} {o.length}cm · {o.boardType} ｜ 侧刃{o.edgeSide}° /
                  底刃{o.edgeBase}° ｜ {o.waxType} ｜ 损伤 {o.damages.length} 处
                </p>
                <p className="muted">
                  开单 {fmt(o.createdAt)} · 最近维护 {fmt(o.updatedAt)}
                  {o.completedAt && ` · 完工 ${fmt(o.completedAt)}`}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>客户档案</p>
          <h2>客户与维护历史</h2>
        </div>
      </div>
      {groups.length === 0 && <p className="muted">暂无客户记录。</p>}
      <div className="records">
        {groups.map((g) => {
          const [name, phone] = g.key.split("|");
          return (
            <article
              key={g.key}
              className="order-card clickable"
              onClick={() => setSelectedKey(g.key)}
            >
              <div className="order-main">
                <div className="order-title">
                  <b>{name || "（未留姓名）"}</b>
                  {phone && <span className="muted">{phone}</span>}
                </div>
                <p className="muted">
                  工单 {g.list.length} 张 · 最近维护 {fmt(g.lastTime)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
