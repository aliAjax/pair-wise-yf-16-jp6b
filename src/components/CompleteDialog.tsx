import { useMemo, useState } from "react";
import type { Conflict, Order } from "../types";
import { findConflicts, fmtDateTime, fromLocalInput, toLocalInput } from "../utils";

interface Props {
  order: Order;
  onCancel: () => void;
  onConflictSelect: (damageId: string) => void;
  onConfirm: (completedAt: string) => void;
}

export default function CompleteDialog({
  order,
  onCancel,
  onConflictSelect,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(toLocalInput(new Date().toISOString()));
  const completedAt = fromLocalInput(value);

  const conflicts: Conflict[] = useMemo(
    () => (completedAt ? findConflicts(order, completedAt) : []),
    [order, completedAt],
  );

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>完工检查 · {order.id}</h3>
        <p className="modal-sub">
          {order.brand} · {order.lengthCm || "?"}cm · {order.shape}
        </p>

        <label className="full">
          <span>完工时间</span>
          <input
            type="datetime-local"
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>

        <div className={`conflict-box${conflicts.length ? "" : " ok"}`}>
          {conflicts.length === 0 ? (
            <p className="no-conflict">✓ 检查通过：所有损伤点都有修补位置，且修补时间不晚于完工时间。</p>
          ) : (
            <>
              <p className="conflict-title">完工被拦截，发现 {conflicts.length} 处冲突：</p>
              <ul>
                {conflicts.map((c, i) => (
                  <li key={i}>
                    <span>{c.message}</span>
                    {c.damageId && (
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => onConflictSelect(c.damageId!)}
                      >
                        定位到该损伤 →
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {order.damages.length === 0 && (
          <p className="soft-note">本单没有底板/边刃损伤点，直接完工即可。</p>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            再检查一下
          </button>
          <button
            type="button"
            className="primary"
            disabled={conflicts.length > 0 || !completedAt}
            onClick={() => onConfirm(completedAt)}
          >
            确认完工（锁定当时参数）
          </button>
        </div>
        <p className="modal-foot">
          完工时间当前值：{fmtDateTime(completedAt)}
        </p>
      </div>
    </div>
  );
}
