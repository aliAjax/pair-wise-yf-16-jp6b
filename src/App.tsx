import { useEffect, useMemo, useRef, useState } from "react";
import type { Order, Status, UiState } from "./types";
import {
  loadOrders,
  loadUi,
  saveOrders,
  saveUi,
  seedOrders,
} from "./store";
import { descriptorOf } from "./utils";
import OrderList from "./components/OrderList";
import OrderEditor from "./components/OrderEditor";
import CustomerPage from "./components/CustomerPage";
import "./styles.css";

type Filter = Status | "all";

function buildSnapshot(o: Order, at: string): Order["snapshot"] {
  return {
    at,
    brand: o.brand,
    lengthCm: o.lengthCm,
    shape: o.shape,
    sideEdgeDeg: o.sideEdgeDeg,
    baseEdgeDeg: o.baseEdgeDeg,
    waxType: o.waxType,
    waxOther: o.waxOther,
    preference: o.preference,
    damages: o.damages.map((d) => ({
      no: d.no,
      kind: d.kind,
      descriptor: descriptorOf(d),
      description: d.description,
      repairs: d.repairs.map((r) => ({
        time: r.time,
        location: r.location,
        note: r.note,
      })),
    })),
  };
}

function newOrder(seq: number): Order {
  const now = new Date().toISOString();
  return {
    id: `WB-${new Date().getFullYear()}-${String(seq).padStart(3, "0")}`,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    customerName: "",
    customerPhone: "",
    brand: "",
    lengthCm: "",
    shape: "",
    sideEdgeDeg: "88",
    baseEdgeDeg: "1",
    waxType: "",
    waxOther: "",
    preference: "",
    damages: [],
  };
}

export default function App() {
  const [orders, setOrders] = useState<Order[]>(() => loadOrders() ?? seedOrders());
  const initialUi = useRef<UiState>({
    tab: "orders",
    filter: "all",
    query: "",
    openOrderId: null,
    ...loadUi(),
  });
  const [tab, setTab] = useState<UiState["tab"]>(initialUi.current.tab);
  const [filter, setFilter] = useState<Filter>(initialUi.current.filter);
  const [query, setQuery] = useState(initialUi.current.query);
  const [openOrderId, setOpenOrderId] = useState<string | null>(
    initialUi.current.openOrderId,
  );
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveUi({ tab, filter, query, openOrderId });
  }, [tab, filter, query, openOrderId]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      ready: orders.filter((o) => o.status === "ready").length,
      done: orders.filter((o) => o.status === "done").length,
    }),
    [orders],
  );

  const visibleOrders = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return orders
      .filter((o) => (filter === "all" ? true : o.status === filter))
      .filter((o) => {
        if (!kw) return true;
        return [
          o.id,
          o.customerName,
          o.customerPhone,
          o.brand,
          o.shape,
          o.lengthCm,
          o.preference,
        ]
          .join(" ")
          .toLowerCase()
          .includes(kw);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [orders, filter, query]);

  const openOrder = orders.find((o) => o.id === openOrderId) ?? null;

  function updateOrder(next: Order) {
    setOrders((prev) => prev.map((o) => (o.id === next.id ? next : o)));
  }

  function createOrder() {
    const seq =
      orders.reduce((max, o) => {
        const m = o.id.match(/-(\d+)$/);
        return m ? Math.max(max, Number(m[1])) : max;
      }, 0) + 1;
    const o = newOrder(seq);
    setOrders((prev) => [o, ...prev]);
    setOpenOrderId(o.id);
    setFilter("all");
  }

  function deleteOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setOpenOrderId((cur) => (cur === id ? null : cur));
  }

  function completeOrder(id: string, completedAt: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "ready" as Status,
              completedAt,
              deliveredAt: undefined,
              snapshot: buildSnapshot(o, completedAt),
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
  }

  function deliverOrder(id: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "done" as Status,
              deliveredAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
  }

  function reopenOrder(id: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "pending" as Status,
              completedAt: undefined,
              deliveredAt: undefined,
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(orders, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `雪板调校台账_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("bad");
        if (
          !window.confirm(
            `导入将替换当前全部 ${orders.length} 张工单（文件内 ${data.length} 张）。确定继续？`,
          )
        )
          return;
        setOrders(data as Order[]);
        setOpenOrderId(null);
      } catch {
        window.alert("导入失败：文件不是有效的台账备份。");
      }
    };
    reader.readAsText(file);
  }

  const filterItems: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "全部工单", count: counts.all },
    { key: "pending", label: "待维护", count: counts.pending },
    { key: "ready", label: "待交付", count: counts.ready },
    { key: "done", label: "已完成", count: counts.done },
  ];

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">⛷</div>
          <div>
            <h1>雪板调校工单台</h1>
            <p>品牌 · 长度 · 板型 · 刃角 · 蜡型 · 底板损伤与修补记录，一张工单管到底</p>
          </div>
        </div>
        <div className="topbar-tools">
          <span className="local-note" title="数据保存在当前浏览器 localStorage">
            本机存储 · 关浏览器不丢
          </span>
          <button type="button" onClick={exportJson}>
            导出台账
          </button>
          <button type="button" onClick={() => importRef.current?.click()}>
            导入备份
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <section className="metrics">
        <article>
          <small>待维护</small>
          <strong>{counts.pending}</strong>
        </article>
        <article>
          <small>待交付</small>
          <strong>{counts.ready}</strong>
        </article>
        <article>
          <small>已完成</small>
          <strong>{counts.done}</strong>
        </article>
        <article>
          <small>底板修补点</small>
          <strong>
            {orders.reduce(
              (acc, o) => acc + o.damages.reduce((n, d) => n + d.repairs.length, 0),
              0,
            )}
          </strong>
        </article>
      </section>

      <nav className="tabs">
        <button
          type="button"
          className={tab === "orders" ? "active" : ""}
          onClick={() => setTab("orders")}
        >
          维护工单
        </button>
        <button
          type="button"
          className={tab === "customers" ? "active" : ""}
          onClick={() => setTab("customers")}
        >
          客户历史
        </button>
      </nav>

      {tab === "orders" ? (
        <section className="workspace">
          <aside className="panel filter-panel">
            <h2>状态筛选</h2>
            <div className="filter-list">
              {filterItems.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`filter-chip ${filter === f.key ? "active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  <span>{f.label}</span>
                  <b>{f.count}</b>
                </button>
              ))}
            </div>

            <h2 className="mt">搜索</h2>
            <input
              className="filter-search"
              placeholder="工单号 / 客户 / 品牌 / 板型"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button type="button" className="primary new-btn" onClick={createOrder}>
              ＋ 新建工单
            </button>

            <p className="soft-note flow-note">
              流程：新建 → 维护中记录修补 → 完工检查（校验修补位置与时间）→ 待交付 →
              客户取板后确认交付。
            </p>
          </aside>

          <div className="main-col">
            {openOrder && (
              <OrderEditor
                order={openOrder}
                onChange={updateOrder}
                onDelete={deleteOrder}
                onClose={() => setOpenOrderId(null)}
                onComplete={completeOrder}
                onDeliver={deliverOrder}
                onReopen={reopenOrder}
              />
            )}
            <section className="panel list-panel">
              <div className="heading">
                <div>
                  <p className="eyebrow">
                    {filter === "all"
                      ? "全部"
                      : filter === "pending"
                        ? "待维护"
                        : filter === "ready"
                          ? "待交付"
                          : "已完成"}
                  </p>
                  <h2>工单列表（{visibleOrders.length}）</h2>
                </div>
              </div>
              <OrderList
                orders={visibleOrders}
                openOrderId={openOrderId}
                onOpen={setOpenOrderId}
              />
            </section>
          </div>
        </section>
      ) : (
        <CustomerPage
          orders={orders}
          onOpenOrder={(id) => {
            setTab("orders");
            setOpenOrderId(id);
          }}
        />
      )}

      <footer className="foot">
        所有工单仅保存在本浏览器（localStorage），换班重新打开页面即可继续处理；
        建议定期「导出台账」备份。
      </footer>
    </main>
  );
}
