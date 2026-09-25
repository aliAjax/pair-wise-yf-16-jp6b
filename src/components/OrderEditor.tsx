import { useEffect, useRef, useState } from "react";
import type { Damage, DamageKind, Order } from "../types";
import { SHAPES, WAX_TYPES, fmtDateTime } from "../utils";
import DamagePanel from "./DamagePanel";
import CompleteDialog from "./CompleteDialog";

interface Props {
  order: Order;
  onChange: (next: Order) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onComplete: (id: string, completedAt: string) => void;
  onDeliver: (id: string) => void;
  onReopen: (id: string) => void;
}

const TEXT_FIELDS: { key: keyof Order; label: string; placeholder?: string }[] = [
  { key: "customerName", label: "客户姓名", placeholder: "如：陈默" },
  { key: "customerPhone", label: "联系电话", placeholder: "方便通知取板" },
  { key: "brand", label: "雪板品牌 / 型号", placeholder: "如：Burton Custom" },
  { key: "lengthCm", label: "长度 (cm)", placeholder: "如：156" },
];

export default function OrderEditor({
  order,
  onChange,
  onDelete,
  onClose,
  onComplete,
  onDeliver,
  onReopen,
}: Props) {
  const [selectedDamage, setSelectedDamage] = useState<string | null>(
    order.damages[0]?.id ?? null,
  );
  const [addKind, setAddKind] = useState<DamageKind | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");
  const firstRef = useRef(true);

  const locked = order.status !== "pending";

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    setSavedAt(fmtDateTime(new Date().toISOString()));
  }, [order]);

  // 切换工单时重置损伤选择
  useEffect(() => {
    setSelectedDamage(order.damages[0]?.id ?? null);
    setAddKind(null);
    setHighlightId(null);
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function patch<K extends keyof Order>(key: K, value: Order[K]) {
    onChange({ ...order, [key]: value, updatedAt: new Date().toISOString() });
  }

  function patchDamages(damages: Damage[]) {
    onChange({ ...order, damages, updatedAt: new Date().toISOString() });
  }

  function handleDeliver() {
    if (!window.confirm(`确认交付工单 ${order.id}？交付后进入「已完成」。`)) return;
    onDeliver(order.id);
  }

  function handleReopen() {
    if (
      !window.confirm(
        "重新打开该工单将解除完工锁定（已保留的历史快照仍可在客户历史中查看）。继续？",
      )
    )
      return;
    onReopen(order.id);
  }

  return (
    <section className={`editor panel${locked ? " locked" : ""}`}>
      <div className="editor-head">
        <div>
          <p className="eyebrow">工单详情</p>
          <h2>{order.id}</h2>
          <div className="editor-meta">
            <span>创建 {fmtDateTime(order.createdAt)}</span>
            <span>最近更新 {fmtDateTime(order.updatedAt)}</span>
            {order.completedAt && <span>完工 {fmtDateTime(order.completedAt)}</span>}
            {order.deliveredAt && <span>交付 {fmtDateTime(order.deliveredAt)}</span>}
            {savedAt && !locked && <em className="saved-flag">已自动保存 {savedAt}</em>}
          </div>
        </div>
        <div className="editor-actions">
          {order.status === "pending" && (
            <button type="button" className="primary" onClick={() => setShowComplete(true)}>
              完工检查
            </button>
          )}
          {order.status === "ready" && (
            <>
              <button type="button" className="primary" onClick={handleDeliver}>
                确认交付
              </button>
              <button type="button" onClick={handleReopen}>
                重新打开
              </button>
            </>
          )}
          {order.status === "done" && (
            <button type="button" onClick={handleReopen}>
              重新打开
            </button>
          )}
          <button type="button" onClick={onClose}>
            收起
          </button>
        </div>
      </div>

      {locked && order.snapshot && (
        <div className="lock-banner">
          🔒 该单已于 {fmtDateTime(order.snapshot.at)} 完工并锁定，以下为完工当时参数；
          需要继续处理可点「重新打开」。
        </div>
      )}

      <fieldset disabled={locked} className="editor-fieldset">
        <div className="form-grid">
          {TEXT_FIELDS.map((f) => (
            <label key={f.key}>
              <span>{f.label}</span>
              <input
                value={String(order[f.key] ?? "")}
                placeholder={f.placeholder}
                onChange={(e) => patch(f.key, e.target.value as never)}
              />
            </label>
          ))}

          <label>
            <span>板型</span>
            <select
              value={order.shape}
              onChange={(e) => patch("shape", e.target.value)}
            >
              <option value="">请选择板型</option>
              {SHAPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="edge-angle-cell">
            <span className="cell-title">刃角参数</span>
            <div className="edge-angle-row">
              <label>
                <span>侧刃角 (°)</span>
                <input
                  type="number"
                  step="0.5"
                  min="80"
                  max="90"
                  value={order.sideEdgeDeg}
                  placeholder="88"
                  onChange={(e) => patch("sideEdgeDeg", e.target.value)}
                />
              </label>
              <label>
                <span>底刃角 (°)</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="3"
                  value={order.baseEdgeDeg}
                  placeholder="1"
                  onChange={(e) => patch("baseEdgeDeg", e.target.value)}
                />
              </label>
            </div>
          </div>

          <label>
            <span>打蜡类型</span>
            <select
              value={order.waxType}
              onChange={(e) => patch("waxType", e.target.value)}
            >
              <option value="">请选择蜡型</option>
              {WAX_TYPES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
              <option value="其他">其他（自定义）</option>
            </select>
          </label>
          {order.waxType === "其他" && (
            <label>
              <span>自定义蜡型</span>
              <input
                value={order.waxOther}
                placeholder="填写蜡型名称"
                onChange={(e) => patch("waxOther", e.target.value)}
              />
            </label>
          )}

          <label className="full preference">
            <span>客户偏好</span>
            <textarea
              rows={2}
              value={order.preference}
              placeholder="如：喜欢刻滑、刃不要太锋利、取板时间要求……"
              onChange={(e) => patch("preference", e.target.value)}
            />
          </label>
        </div>

        <h3 className="section-title">底板损伤与修补</h3>
        <DamagePanel
          damages={order.damages}
          selectedId={selectedDamage}
          addKind={addKind}
          locked={locked}
          highlightId={highlightId}
          onChange={patchDamages}
          onSelect={setSelectedDamage}
          onPickKind={setAddKind}
        />

        {!locked && (
          <div className="editor-footer">
            <button
              type="button"
              className="danger-link"
              onClick={() => {
                if (window.confirm(`确定删除工单 ${order.id}？此操作不可恢复。`)) {
                  onDelete(order.id);
                }
              }}
            >
              删除工单
            </button>
          </div>
        )}
      </fieldset>

      {showComplete && (
        <CompleteDialog
          order={order}
          onCancel={() => setShowComplete(false)}
          onConflictSelect={(id) => {
            setSelectedDamage(id);
            setHighlightId(id);
            setShowComplete(false);
            window.setTimeout(() => setHighlightId(null), 4000);
          }}
          onConfirm={(completedAt) => {
            setShowComplete(false);
            onComplete(order.id, completedAt);
          }}
        />
      )}
    </section>
  );
}
