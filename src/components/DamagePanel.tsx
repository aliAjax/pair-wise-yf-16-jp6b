import { useEffect, useState } from "react";
import type { Damage, DamageKind } from "../types";
import {
  BOARD,
  descriptorOf,
  fmtDateTime,
  fromLocalInput,
  toLocalInput,
} from "../utils";
import BoardDiagram from "./BoardDiagram";

interface Props {
  damages: Damage[];
  selectedId: string | null;
  addKind: DamageKind | null;
  locked: boolean;
  highlightId: string | null;
  onChange: (damages: Damage[]) => void;
  onSelect: (id: string | null) => void;
  onPickKind: (k: DamageKind | null) => void;
}

export default function DamagePanel({
  damages,
  selectedId,
  addKind,
  locked,
  highlightId,
  onChange,
  onSelect,
  onPickKind,
}: Props) {
  const [repTime, setRepTime] = useState(toLocalInput(new Date().toISOString()));
  const [repLocation, setRepLocation] = useState("");
  const [repNote, setRepNote] = useState("");

  const selected = damages.find((d) => d.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) setRepLocation(autoLocation(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function patch(next: Damage[]) {
    onChange(next);
  }

  function addPoint(p: { x: number; y: number }) {
    if (!addKind) return;
    const d: Damage = {
      id: `dmg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      no: damages.length + 1,
      kind: addKind,
      x: p.x,
      y: p.y,
      description: "",
      repairs: [],
    };
    onChange([...damages, d]);
    onSelect(d.id);
    onPickKind(null);
    setRepTime(toLocalInput(new Date().toISOString()));
    setRepLocation(autoLocation(d));
  }

  function autoLocation(d: Damage): string {
    const zone = d.y < 120 ? "板头" : d.y > 240 ? "板尾" : "板腰";
    const along = `${Math.round((d.y / BOARD.H) * 100)}% 处`;
    if (d.kind === "edge") {
      const side = d.x <= (BOARD.X0 + BOARD.X1) / 2 ? "左侧刃" : "右侧刃";
      return `${zone}${side} · 距板头${along}`;
    }
    return `${zone}底板 · 距板头${along}`;
  }

  function updateDamage(id: string, body: Partial<Damage>) {
    patch(damages.map((d) => (d.id === id ? { ...d, ...body } : d)));
  }

  function deleteDamage(id: string) {
    if (!window.confirm("删除该损伤点及其全部修补记录？")) return;
    const next = damages
      .filter((d) => d.id !== id)
      .map((d, i) => ({ ...d, no: i + 1 }));
    patch(next);
    if (selectedId === id) onSelect(null);
  }

  function addRepair() {
    if (!selected) return;
    const time = fromLocalInput(repTime);
    const location = repLocation.trim();
    if (!time) {
      window.alert("请填写修补时间");
      return;
    }
    if (!location) {
      window.alert("请填写修补位置（完工时也会校验）");
      return;
    }
    const repair = {
      id: `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      time,
      location,
      note: repNote.trim(),
    };
    updateDamage(selected.id, { repairs: [...selected.repairs, repair] });
    setRepNote("");
    setRepLocation(autoLocation(selected));
  }

  function deleteRepair(repairId: string) {
    if (!selected || !window.confirm("删除这条修补记录？")) return;
    updateDamage(selected.id, {
      repairs: selected.repairs.filter((r) => r.id !== repairId),
    });
  }

  return (
    <div className="damage-layout">
      <div className="damage-side">
        <div className="damage-toolbar">
          <button
            type="button"
            className={addKind === "base" ? "pick active" : "pick"}
            disabled={locked}
            onClick={() => onPickKind(addKind === "base" ? null : "base")}
          >
            ＋ 点选底板划痕
          </button>
          <button
            type="button"
            className={addKind === "edge" ? "pick active" : "pick"}
            disabled={locked}
            onClick={() => onPickKind(addKind === "edge" ? null : "edge")}
          >
            ＋ 点选边刃伤
          </button>
        </div>

        <div className="damage-list">
          {damages.length === 0 && (
            <p className="empty-hint">尚未标记损伤。点击上方按钮后在底板图上落点。</p>
          )}
          {damages.map((d) => (
            <div
              key={d.id}
              className={`damage-item${d.id === selectedId ? " sel" : ""}${
                d.id === highlightId ? " conflict-hl" : ""
              }`}
              onClick={() => onSelect(d.id)}
            >
              <i className={`mini-mark ${d.kind === "edge" ? "edge" : "base"}`} />
              <div className="damage-item-main">
                <b>
                  {d.kind === "edge" ? "边刃伤" : "底板划痕"} #{d.no}
                </b>
                <small>{d.description || autoLocation(d)}</small>
                <span className="repair-count">
                  修补 {d.repairs.length} 次
                  {d.repairs.length > 0 &&
                    ` · 最近 ${fmtDateTime(
                      d.repairs.reduce<string>(
                        (a, r) => (r.time > a ? r.time : a),
                        "",
                      ),
                    )}`}
                </span>
              </div>
              {!locked && (
                <button
                  type="button"
                  className="icon-btn"
                  title="删除损伤点"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDamage(d.id);
                  }}
                >
                  删除
                </button>
              )}
            </div>
          ))}
        </div>

        {selected && (
          <div className={`repair-box${highlightId === selected.id ? " conflict-hl" : ""}`}>
            <h4>
              {descriptorOf(selected)}
              <span className="repair-count">（共 {selected.repairs.length} 次修补）</span>
            </h4>
            <label className="full">
              <span>损伤描述</span>
              <textarea
                rows={2}
                value={selected.description}
                disabled={locked}
                placeholder="如：板腰底板 12cm 划痕、边刃小缺口"
                onChange={(e) => updateDamage(selected.id, { description: e.target.value })}
              />
            </label>

            <div className="repair-records">
              {selected.repairs.length === 0 && (
                <p className="empty-hint">该点还没有修补记录。</p>
              )}
              {[...selected.repairs]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((r) => (
                  <div key={r.id} className="repair-row">
                    <div>
                      <b>{fmtDateTime(r.time)}</b>
                      <span>{r.location}</span>
                      {r.note && <small>{r.note}</small>}
                    </div>
                    {!locked && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => deleteRepair(r.id)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
            </div>

            {!locked && (
              <div className="repair-form">
                <h5>新增一次修补（各自保留时间）</h5>
                <label>
                  <span>修补时间</span>
                  <input
                    type="datetime-local"
                    step={1}
                    value={repTime}
                    onChange={(e) => setRepTime(e.target.value)}
                  />
                </label>
                <label>
                  <span>修补位置 *</span>
                  <input
                    value={repLocation}
                    placeholder="如：板腰底板 · 距板头 52% 处"
                    onChange={(e) => setRepLocation(e.target.value)}
                  />
                </label>
                <label className="full">
                  <span>工艺备注</span>
                  <input
                    value={repNote}
                    placeholder="如：P-Tex 填补后刮平、金刚石锉修形"
                    onChange={(e) => setRepNote(e.target.value)}
                  />
                </label>
                <button type="button" className="primary small" onClick={addRepair}>
                  记录这次修补
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <BoardDiagram
        damages={damages}
        selectedId={selectedId}
        addKind={addKind}
        locked={locked}
        onAddPoint={addPoint}
        onSelect={(id) => onSelect(id)}
      />
    </div>
  );
}
