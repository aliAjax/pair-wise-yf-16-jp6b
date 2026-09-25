import { useState } from "react";
import { Order, Status } from "../types";
import { STATUS_LABEL, fmt, toInput, validateCompletion } from "../store";

interface Props {
  orders: Order[];
  onUpdate: (order: Order) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onSeed: () => void;
}

type Filter = "all" | Status;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待维护" },
  { key: "delivering", label: "待交付" },
  { key: "done", label: "已完成" },
];

export default function OrderList({
  orders,
  onUpdate,
  onDelete,
  onEdit,
  onView,
  onSeed,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [completing, setCompleting] = useState<Order | null>(null);
  const [doneTime, setDoneTime] = useState(toInput(new Date()));
  const [conflicts, setConflicts] = useState<string[]>([]);

  const shown = orders
    .filter((o) => filter === "all" || o.status === filter)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const openComplete = (o: Order) => {
    setCompleting(o);
    setDoneTime(toInput(new Date()));
    setConflicts([]);
  };

  const confirmComplete = () => {
    if (!completing || !doneTime) return;
    const completedAt = new Date(doneTime).toISOString();
    const problems = validateCompletion(completing, completedAt);
    if (problems.length > 0) {
      setConflicts(problems);
      return;
    }
    onUpdate({
      ...completing,
      status: "done",
      completedAt,
      updatedAt: new Date().toISOString(),
    });
    setCompleting(null);
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>工单台</p>
          <h2>维护工单</h2>
        </div>
        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? "chip active" : "chip"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== "all" &&
                ` (${orders.filter((o) => o.status === f.key).length})`}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 && (
        <div className="empty">
          <p>还没有工单。新建一张，或载入示例数据看看效果。</p>
          <button className="primary" onClick={onSeed}>
            载入示例数据
          </button>
        </div>
      )}

      <div className="records">
        {shown.map((o) => (
          <article key={o.id} className="order-card">
            <div className="order-main">
              <div className="order-title">
                <b>{o.id}</b>
                <span className={`badge ${o.status}`}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <p>
                {o.customerName}
                {o.customerPhone && ` · ${o.customerPhone}`} ｜ {o.brand}{" "}
                {o.length}cm · {o.boardType} ｜ 侧刃{o.edgeSide}° / 底刃
                {o.edgeBase}° ｜ {o.waxType}
              </p>
              <p className="muted">
                底板损伤 {o.damages.length} 处（修补{" "}
                {o.damages.reduce((n, d) => n + d.repairs.length, 0)} 次） ·
                更新于 {fmt(o.updatedAt)}
                {o.completedAt && ` · 完工于 ${fmt(o.completedAt)}`}
              </p>
              {o.preference && <p className="pref">偏好：{o.preference}</p>}
            </div>
            <div className="order-actions">
              {o.status === "pending" && (
                <button
                  className="primary"
                  onClick={() =>
                    onUpdate({
                      ...o,
                      status: "delivering",
                      updatedAt: new Date().toISOString(),
                    })
                  }
                >
                  开始维护
                </button>
              )}
              {o.status === "delivering" && (
                <button className="primary" onClick={() => openComplete(o)}>
                  完工交付
                </button>
              )}
              {o.status !== "done" ? (
                <button onClick={() => onEdit(o.id)}>编辑 / 标记损伤</button>
              ) : (
                <button onClick={() => onView(o.id)}>查看快照</button>
              )}
              <button
                className="link danger"
                onClick={() => {
                  if (window.confirm(`确定删除工单 ${o.id}？`)) onDelete(o.id);
                }}
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>

      {completing && (
        <div className="modal-mask" onClick={() => setCompleting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>完工交付 · {completing.id}</h3>
            <label>
              <span>完工时间</span>
              <input
                type="datetime-local"
                value={doneTime}
                onChange={(e) => {
                  setDoneTime(e.target.value);
                  setConflicts([]);
                }}
              />
            </label>

            {conflicts.length > 0 && (
              <div className="conflicts">
                <b>存在 {conflicts.length} 处冲突，无法完工：</b>
                <ul>
                  {conflicts.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="muted">
                  请返回工单补齐修补位置，或把完工时间调整到最后一次修补之后。
                </p>
              </div>
            )}

            <div className="row end">
              <button onClick={() => setCompleting(null)}>取消</button>
              <button className="primary" onClick={confirmComplete}>
                确认完工
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
