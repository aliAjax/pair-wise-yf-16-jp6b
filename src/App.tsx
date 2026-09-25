import { useEffect, useState } from "react";
import { Order } from "./types";
import { loadOrders, saveOrders, seedOrders } from "./store";
import OrderList from "./components/OrderList";
import OrderForm from "./components/OrderForm";
import Customers from "./components/Customers";
import OrderView from "./components/OrderView";
import "./styles.css";

type Route =
  | { name: "list" }
  | { name: "form"; orderId?: string }
  | { name: "customers" }
  | { name: "order"; id: string };

function App() {
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [route, setRoute] = useState<Route>({ name: "list" });

  // 任何变更立即写入 localStorage，换班重开浏览器可继续处理
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const upsert = (order: Order) =>
    setOrders((prev) => {
      const i = prev.findIndex((o) => o.id === order.id);
      if (i === -1) return [order, ...prev];
      const next = [...prev];
      next[i] = order;
      return next;
    });

  const remove = (id: string) =>
    setOrders((prev) => prev.filter((o) => o.id !== id));

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    delivering: orders.filter((o) => o.status === "delivering").length,
    done: orders.filter((o) => o.status === "done").length,
  };

  const editing =
    route.name === "form" && route.orderId
      ? orders.find((o) => o.id === route.orderId)
      : undefined;
  const viewing =
    route.name === "order" ? orders.find((o) => o.id === route.id) : undefined;

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>滑雪板调校工单</h1>
          <p className="muted">数据保存在本机浏览器 · 换班重开可继续处理</p>
        </div>
        <nav>
          <button
            className={route.name === "list" ? "chip active" : "chip"}
            onClick={() => setRoute({ name: "list" })}
          >
            工单列表
          </button>
          <button
            className={route.name === "form" ? "chip active" : "chip"}
            onClick={() => setRoute({ name: "form" })}
          >
            新建工单
          </button>
          <button
            className={route.name === "customers" ? "chip active" : "chip"}
            onClick={() => setRoute({ name: "customers" })}
          >
            客户档案
          </button>
        </nav>
      </header>

      <section className="metrics">
        <article>
          <small>待维护</small>
          <strong>{counts.pending}</strong>
        </article>
        <article>
          <small>待交付</small>
          <strong>{counts.delivering}</strong>
        </article>
        <article>
          <small>已完成</small>
          <strong>{counts.done}</strong>
        </article>
        <article>
          <small>底板修补总次数</small>
          <strong>
            {orders.reduce(
              (n, o) => n + o.damages.reduce((m, d) => m + d.repairs.length, 0),
              0
            )}
          </strong>
        </article>
      </section>

      {route.name === "list" && (
        <OrderList
          orders={orders}
          onUpdate={upsert}
          onDelete={remove}
          onEdit={(id) => setRoute({ name: "form", orderId: id })}
          onView={(id) => setRoute({ name: "order", id })}
          onSeed={() => setOrders(seedOrders())}
        />
      )}

      {route.name === "form" && (
        <OrderForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSave={(order) => {
            upsert(order);
            setRoute({ name: "list" });
          }}
          onCancel={() => setRoute({ name: "list" })}
        />
      )}

      {route.name === "customers" && (
        <Customers
          orders={orders}
          onOpenOrder={(id) => setRoute({ name: "order", id })}
        />
      )}

      {route.name === "order" &&
        (viewing ? (
          <OrderView order={viewing} onBack={() => setRoute({ name: "list" })} />
        ) : (
          <section className="panel">
            <p className="muted">工单不存在或已删除。</p>
            <button onClick={() => setRoute({ name: "list" })}>返回列表</button>
          </section>
        ))}
    </main>
  );
}

export default App;
