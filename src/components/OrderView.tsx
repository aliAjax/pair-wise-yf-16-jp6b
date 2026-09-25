import { Order } from "../types";
import { STATUS_LABEL, fmt } from "../store";
import BaseDiagram from "./BaseDiagram";

interface Props {
  order: Order;
  onBack: () => void;
}

/** 只读快照：打开旧工单时展示当时记录的参数 */
export default function OrderView({ order, onBack }: Props) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>工单快照（只读）</p>
          <h2>
            {order.id}{" "}
            <span className={`badge ${order.status}`}>
              {STATUS_LABEL[order.status]}
            </span>
          </h2>
        </div>
        <button onClick={onBack}>返回</button>
      </div>

      <dl className="snapshot">
        <div>
          <dt>客户</dt>
          <dd>
            {order.customerName}
            {order.customerPhone && ` · ${order.customerPhone}`}
          </dd>
        </div>
        <div>
          <dt>雪板</dt>
          <dd>
            {order.brand} · {order.length}cm · {order.boardType}
          </dd>
        </div>
        <div>
          <dt>刃角</dt>
          <dd>
            侧刃 {order.edgeSide}° / 底刃 {order.edgeBase}°
          </dd>
        </div>
        <div>
          <dt>打蜡类型</dt>
          <dd>{order.waxType}</dd>
        </div>
        <div>
          <dt>客户偏好</dt>
          <dd>{order.preference || "—"}</dd>
        </div>
        <div>
          <dt>时间</dt>
          <dd>
            开单 {fmt(order.createdAt)} · 更新 {fmt(order.updatedAt)}
            {order.completedAt && ` · 完工 ${fmt(order.completedAt)}`}
          </dd>
        </div>
      </dl>

      <h3>底板损伤与修补记录</h3>
      <BaseDiagram damages={order.damages} readOnly />
    </section>
  );
}
