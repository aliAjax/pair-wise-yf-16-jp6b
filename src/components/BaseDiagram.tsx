import { useRef, useState } from "react";
import { Damage, DamageType } from "../types";
import { DAMAGE_LABEL, fmt, toInput, uid } from "../store";

const VB_W = 220;
const VB_H = 640;

interface Props {
  damages: Damage[];
  onChange?: (damages: Damage[]) => void;
  readOnly?: boolean;
}

export default function BaseDiagram({ damages, onChange, readOnly }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<DamageType>("scratch");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rTime, setRTime] = useState(toInput(new Date()));
  const [rPos, setRPos] = useState("");
  const [rNote, setRNote] = useState("");

  const selected = damages.find((d) => d.id === selectedId) ?? null;

  const addDamage = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onChange || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VB_W;
    const y = ((e.clientY - rect.top) / rect.height) * VB_H;
    const damage: Damage = {
      id: uid(),
      x: Math.round(x),
      y: Math.round(y),
      type: mode,
      repairs: [],
    };
    onChange([...damages, damage]);
    setSelectedId(damage.id);
    setRPos("");
    setRNote("");
    setRTime(toInput(new Date()));
  };

  const addRepair = () => {
    if (!selected || !onChange || !rTime) return;
    const repair = {
      id: uid(),
      time: new Date(rTime).toISOString(),
      position: rPos.trim(),
      note: rNote.trim(),
    };
    onChange(
      damages.map((d) =>
        d.id === selected.id ? { ...d, repairs: [...d.repairs, repair] } : d
      )
    );
    setRPos("");
    setRNote("");
    setRTime(toInput(new Date()));
  };

  const removeRepair = (repairId: string) => {
    if (!selected || !onChange) return;
    onChange(
      damages.map((d) =>
        d.id === selected.id
          ? { ...d, repairs: d.repairs.filter((r) => r.id !== repairId) }
          : d
      )
    );
  };

  const removeDamage = () => {
    if (!selected || !onChange) return;
    onChange(damages.filter((d) => d.id !== selected.id));
    setSelectedId(null);
  };

  return (
    <div className="diagram-wrap">
      {!readOnly && (
        <div className="diagram-toolbar">
          <span>点选类型：</span>
          <button
            type="button"
            className={mode === "scratch" ? "chip active scratch" : "chip"}
            onClick={() => setMode("scratch")}
          >
            划痕
          </button>
          <button
            type="button"
            className={mode === "edge" ? "chip active edge" : "chip"}
            onClick={() => setMode("edge")}
          >
            边刃伤
          </button>
          <em>在底板图上点击落点；点击已有标记可追加修补</em>
        </div>
      )}

      <div className="diagram-body">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className={readOnly ? "board readonly" : "board"}
          onClick={addDamage}
        >
          {/* 板体 */}
          <path
            d="M110,8 C152,8 172,40 172,92 L172,548 C172,600 152,632 110,632 C68,632 48,600 48,548 L48,92 C48,40 68,8 110,8 Z"
            fill="#eef6fb"
            stroke="#0369a1"
            strokeWidth="3"
          />
          {/* 边刃线 */}
          <path
            d="M110,22 C144,22 160,50 160,96 L160,544 C160,592 144,618 110,618 C76,618 60,592 60,544 L60,96 C60,50 76,22 110,22 Z"
            fill="none"
            stroke="#9fc6e0"
            strokeWidth="1.5"
            strokeDasharray="6 5"
          />
          {/* 中线 */}
          <line x1="110" y1="30" x2="110" y2="610" stroke="#d5e6f2" strokeWidth="2" />
          <text x="110" y="330" textAnchor="middle" fill="#b8d4e8" fontSize="20" transform="rotate(90 110 330)">
            BASE 底板
          </text>

          {damages.map((d, i) => {
            const isSel = d.id === selectedId;
            const color = d.type === "scratch" ? "#f97316" : "#dc2626";
            return (
              <g
                key={d.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(isSel ? null : d.id);
                }}
                style={{ cursor: "pointer" }}
              >
                {d.type === "scratch" ? (
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r={isSel ? 13 : 10}
                    fill={color}
                    fillOpacity={d.repairs.length ? 0.95 : 0.55}
                    stroke={isSel ? "#172033" : "#ffffff"}
                    strokeWidth={isSel ? 3 : 2}
                  />
                ) : (
                  <rect
                    x={d.x - (isSel ? 12 : 9)}
                    y={d.y - (isSel ? 12 : 9)}
                    width={isSel ? 24 : 18}
                    height={isSel ? 24 : 18}
                    fill={color}
                    fillOpacity={d.repairs.length ? 0.95 : 0.55}
                    stroke={isSel ? "#172033" : "#ffffff"}
                    strokeWidth={isSel ? 3 : 2}
                    transform={`rotate(45 ${d.x} ${d.y})`}
                  />
                )}
                <text
                  x={d.x}
                  y={d.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#ffffff"
                  pointerEvents="none"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="diagram-side">
          {damages.length === 0 && (
            <p className="muted">
              {readOnly ? "本单无底板损伤记录。" : "暂无损伤点。选择类型后点击板面添加。"}
            </p>
          )}

          {selected ? (
            <div className="damage-panel">
              <h3>
                损伤点 #{damages.indexOf(selected) + 1} ·{" "}
                {DAMAGE_LABEL[selected.type]}
              </h3>
              <p className="muted">
                坐标 ({selected.x}, {selected.y}) · 已修补{" "}
                {selected.repairs.length} 次
              </p>

              {selected.repairs.length > 0 && (
                <ul className="repair-list">
                  {[...selected.repairs]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((r, ri) => (
                      <li key={r.id}>
                        <div>
                          <b>第 {ri + 1} 次</b>
                          <time>{fmt(r.time)}</time>
                        </div>
                        <p>
                          修补位置：{r.position || <mark>未填写</mark>}
                          {r.note && ` · ${r.note}`}
                        </p>
                        {!readOnly && (
                          <button
                            type="button"
                            className="link danger"
                            onClick={() => removeRepair(r.id)}
                          >
                            删除
                          </button>
                        )}
                      </li>
                    ))}
                </ul>
              )}

              {!readOnly && (
                <>
                  <div className="repair-form">
                    <label>
                      <span>修补时间</span>
                      <input
                        type="datetime-local"
                        value={rTime}
                        onChange={(e) => setRTime(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>修补位置 / 工艺</span>
                      <input
                        value={rPos}
                        onChange={(e) => setRPos(e.target.value)}
                        placeholder="如：P-Tex 填补 + 打磨"
                      />
                    </label>
                    <label>
                      <span>备注</span>
                      <input
                        value={rNote}
                        onChange={(e) => setRNote(e.target.value)}
                        placeholder="可选"
                      />
                    </label>
                    <button type="button" className="primary" onClick={addRepair}>
                      添加修补记录
                    </button>
                  </div>
                  <button
                    type="button"
                    className="link danger"
                    onClick={removeDamage}
                  >
                    删除该损伤点
                  </button>
                </>
              )}
            </div>
          ) : (
            damages.length > 0 && (
              <ul className="damage-summary">
                {damages.map((d, i) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      className="link"
                      onClick={() => setSelectedId(d.id)}
                    >
                      #{i + 1} {DAMAGE_LABEL[d.type]}
                    </button>
                    <span className="muted">修补 {d.repairs.length} 次</span>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>

      <div className="legend">
        <span>
          <i className="dot scratch" /> 划痕
        </span>
        <span>
          <i className="dot edge" /> 边刃伤
        </span>
        <span className="muted">半透明 = 尚未修补，实心 = 已有修补记录</span>
      </div>
    </div>
  );
}
