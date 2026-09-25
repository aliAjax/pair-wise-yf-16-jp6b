import type { Order, Status } from "../types";
import { fmtDateTime, lastRepairTime, orderSummary } from "../utils";

interface Props {
  orders: Order[];
  openOrderId: string | null;
  onOpen: (id: string) => void;
}

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  pending: { label: "待维护", cls: "st-pending" },
  ready: { label: "待交付", cls: "st-ready" },
  done: { label: "已完成", cls: "st-done" },
};

export default function OrderList({ orders, openOrderId, onOpen }: Props) {
  if (orders.length === 0) {
    return <p className="empty-hint big">当前筛选条件下没有工单。</p>;
  }

  return (
    <div className="order-list">
      {orders.map((o) => {
        const meta = STATUS_META[o.status];
        const unrepaired = o.damages.filter((d) => d.repairs.length === 0).length;
        const lastActivity = o.damages.reduce<string>(
          (acc, d) => {
            const t = lastRepairTime(d);
            return t > acc ? t : acc;
          },
          o.updatedAt,
        );
        return (
          <button
            type="button"
            key={o.id}
            className={`order-card${o.id === openOrderId ? " open" : ""}`}
            onClick={() => onOpen(o.id)}
          >
            <div className="order-card-top">
              <b className="order-id">{o.id}</b>
              <span className={`status-pill ${meta.cls}`}>{meta.label}</span>
            </div>
            <div className="order-card-main">
              <b className="order-summary">{orderSummary(o) || "未填写雪板信息"}</b>
              <span className="order-customer">
                {o.customerName || "未登记客户"}
                {o.customerPhone ? ` · ${o.customerPhone}` : ""}
              </span>
              <span className="order-sub">
                刃角 {o.sideEdgeDeg || "?"}°/{o.baseEdgeDeg || "?"}° · 蜡：
                {o.waxType || "未选"}
                {o.waxType === "其他" && o.waxOther ? `（${o.waxOther}）` : ""}
              </span>
              <span className="order-sub">
                损伤 {o.damages.length} 处{unrepaired > 0 ? ` · ${unrepaired} 处待修补` : ""}
              </span>
            </div>
            <div className="order-card-foot">
              <span>最近维护 {fmtDateTime(lastActivity)}</span>
              {o.status === "ready" && o.completedAt && (
                <span>完工 {fmtDateTime(o.completedAt)}</span>
              )}
              {o.status === "done" && o.deliveredAt && (
                <span>交付 {fmtDateTime(o.deliveredAt)}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
