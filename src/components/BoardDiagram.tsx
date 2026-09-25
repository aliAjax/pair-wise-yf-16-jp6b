import { useRef } from "react";
import type { Damage, DamageKind } from "../types";
import { BOARD, boardPoint } from "../utils";

interface Props {
  damages: Damage[];
  selectedId: string | null;
  /** 非空时：下次点选底板图会新增该类型损伤点 */
  addKind: DamageKind | null;
  locked: boolean;
  onAddPoint: (p: { x: number; y: number }) => void;
  onSelect: (id: string) => void;
}

export default function BoardDiagram({
  damages,
  selectedId,
  addKind,
  locked,
  onAddPoint,
  onSelect,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (locked || !addKind || !svgRef.current) return;
    const p = boardPoint(e.clientX, e.clientY, svgRef.current.getBoundingClientRect());
    if (p) onAddPoint(p);
  }

  return (
    <div className={`board-wrap${addKind ? " picking" : ""}${locked ? " locked" : ""}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BOARD.W} ${BOARD.H}`}
        className="board-svg"
        onClick={handleClick}
        role="img"
        aria-label="底板损伤标记图"
      >
        {/* 板底外形 */}
        <path
          className="board-body"
          d="M 20,10 C 34,2 66,2 80,10 C 87,44 87,316 80,350 C 66,358 34,358 20,350 C 13,316 13,44 20,10 Z"
        />
        {/* 左右钢边 */}
        <path className="edge-line edge-l" d="M 20,14 C 14,48 14,312 20,346" />
        <path className="edge-line edge-r" d="M 80,14 C 86,48 86,312 80,346" />
        {/* 板头板尾标识 */}
        <text x="50" y="30" textAnchor="middle" className="board-label">
          板头
        </text>
        <text x="50" y="338" textAnchor="middle" className="board-label">
          板尾
        </text>

        {damages.map((d) => {
          const repaired = d.repairs.length > 0;
          const selected = d.id === selectedId;
          const color = d.kind === "edge" ? "#0369a1" : "#f97316";
          return (
            <g
              key={d.id}
              className={`damage-marker ${selected ? "selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!locked) onSelect(d.id);
              }}
            >
              {selected && <circle cx={d.x} cy={d.y} r={8.5} className="marker-ring" />}
              {d.kind === "edge" ? (
                <rect
                  x={d.x - 4.2}
                  y={d.y - 4.2}
                  width={8.4}
                  height={8.4}
                  rx={1.5}
                  transform={`rotate(45 ${d.x} ${d.y})`}
                  fill={repaired ? color : "#ffffff"}
                  stroke={color}
                  strokeWidth={2.2}
                />
              ) : (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={4.4}
                  fill={repaired ? color : "#ffffff"}
                  stroke={color}
                  strokeWidth={2.2}
                />
              )}
              <text x={d.x} y={d.y + 2.1} textAnchor="middle" className="marker-no">
                {d.no}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="board-legend">
        <span>
          <i className="dot dot-base" /> 底板划痕
        </span>
        <span>
          <i className="dot dot-edge" /> 边刃伤
        </span>
        <span>
          <i className="dot dot-open" /> 未修补
        </span>
      </div>
      <p className="board-hint">
        {locked
          ? "工单已锁定，仅可查看底板图。"
          : addKind
            ? `正在标记${addKind === "edge" ? "边刃伤" : "底板划痕"}：在板面上点击落点（超出板面会吸附到最近钢边）`
            : "选择左侧损伤类型后，在底板图上点选落点；同一点可记录多次修补。"}
      </p>
    </div>
  );
}
