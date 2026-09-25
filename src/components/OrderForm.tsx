import { useState } from "react";
import { Order } from "../types";
import { uid } from "../store";
import BaseDiagram from "./BaseDiagram";

interface Props {
  initial?: Order;
  onSave: (order: Order) => void;
  onCancel: () => void;
}

const BOARD_TYPES = ["全能板", "公园板", "竞速板", "粉雪板", "平花板", "分离板"];
const WAX_TYPES = ["低温蜡", "全温蜡", "高温蜡", "竞速氟蜡", "无氟训练蜡"];
const SIDE_ANGLES = ["90", "89", "88", "87", "86"];
const BASE_ANGLES = ["0", "0.5", "0.75", "1", "1.5"];
const BRANDS = [
  "Burton",
  "Salomon",
  "Capita",
  "Jones",
  "Nitro",
  "GNU",
  "Lib Tech",
  "Head",
  "Atomic",
  "K2",
  "Ride",
  "Yes",
];

export default function OrderForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Order>(
    initial ?? {
      id: `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      customerName: "",
      customerPhone: "",
      brand: "",
      length: "",
      boardType: BOARD_TYPES[0],
      edgeBase: "1",
      edgeSide: "89",
      waxType: WAX_TYPES[1],
      preference: "",
      status: "pending",
      damages: [],
    }
  );
  const [error, setError] = useState("");

  const set = <K extends keyof Order>(key: K, value: Order[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.customerName.trim()) return setError("请填写客户姓名");
    if (!form.brand.trim()) return setError("请填写雪板品牌");
    if (!form.length.trim()) return setError("请填写板长");
    onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>{initial ? `编辑 ${initial.id}` : "新工单"}</p>
          <h2>{initial ? "编辑工单" : "新建工单"}</h2>
        </div>
        <div className="row">
          <button onClick={onCancel}>取消</button>
          <button className="primary" onClick={submit}>
            保存工单
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-layout">
        <div className="field-grid">
          <label>
            <span>客户姓名 *</span>
            <input
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              placeholder="如：张伟"
            />
          </label>
          <label>
            <span>联系电话</span>
            <input
              value={form.customerPhone}
              onChange={(e) => set("customerPhone", e.target.value)}
              placeholder="用于客户档案归并"
            />
          </label>
          <label>
            <span>雪板品牌 *</span>
            <input
              list="brand-list"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="如：Burton"
            />
            <datalist id="brand-list">
              {BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </label>
          <label>
            <span>板长 (cm) *</span>
            <input
              type="number"
              min="80"
              max="200"
              value={form.length}
              onChange={(e) => set("length", e.target.value)}
              placeholder="如：156"
            />
          </label>
          <label>
            <span>板型</span>
            <select
              value={form.boardType}
              onChange={(e) => set("boardType", e.target.value)}
            >
              {BOARD_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <span>打蜡类型</span>
            <select
              value={form.waxType}
              onChange={(e) => set("waxType", e.target.value)}
            >
              {WAX_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <span>侧刃角 (°)</span>
            <select
              value={form.edgeSide}
              onChange={(e) => set("edgeSide", e.target.value)}
            >
              {SIDE_ANGLES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            <span>底刃角 (°)</span>
            <select
              value={form.edgeBase}
              onChange={(e) => set("edgeBase", e.target.value)}
            >
              {BASE_ANGLES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="span2">
            <span>客户偏好</span>
            <textarea
              rows={3}
              value={form.preference}
              onChange={(e) => set("preference", e.target.value)}
              placeholder="如：偏好弱咬雪、取板时间、联系方式偏好等"
            />
          </label>
        </div>

        <BaseDiagram
          damages={form.damages}
          onChange={(damages) => set("damages", damages)}
        />
      </div>
    </section>
  );
}
