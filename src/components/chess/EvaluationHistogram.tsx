import { useMemo, useRef, useEffect, useState } from "react";
import type { MoveWithEval, MoveClassification } from "../../types/chess";

interface EvaluationHistogramProps {
  moves: MoveWithEval[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: "#22d3ee", // cyan-400
  great: "#60a5fa", // blue-400
  best: "#4ade80", // green-400
  excellent: "#86efac", // green-300
  good: "#a3e635", // lime-400
  book: "#a8a29e", // stone-400
  inaccuracy: "#facc15", // yellow-400
  mistake: "#fb923c", // orange-400
  blunder: "#f87171", // red-400
  missed_win: "#fca5a5", // red-300
};

// Only show dots for significant move classifications
const SHOW_DOT_FOR: Set<MoveClassification> = new Set([
  "brilliant",
  "great",
  "best",
  "inaccuracy",
  "mistake",
  "blunder",
  "missed_win",
]);

/**
 * Clamp evaluation to a reasonable range for display
 * Evaluation is in centipawns, we clamp to ±10 pawns (±1000 cp)
 */
function clampEval(score: number, mate: number | null): number {
  if (mate !== null) {
    // Mate scores get maximum value
    return mate > 0 ? 1000 : -1000;
  }
  return Math.max(-1000, Math.min(1000, score));
}

/**
 * Normalize evaluation to 0-1 range for bar height
 * 0 = fully black advantage, 1 = fully white advantage
 */
function normalizeEval(score: number): number {
  // Score is in centipawns, clamped to ±1000
  // Map to 0-1 where 0.5 is equal
  const normalized = (score + 1000) / 2000;
  return Math.max(0, Math.min(1, normalized));
}

export function EvaluationHistogram({
  moves,
  currentMoveIndex,
  onMoveClick,
}: EvaluationHistogramProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width for responsive sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Calculate bar data
  const barData = useMemo(() => {
    return moves.map((move, index) => {
      const eval_ = move.evaluation;
      const score = eval_ ? clampEval(eval_.score, eval_.mate) : 0;
      const height = normalizeEval(score);
      const classification = move.classification;
      const showDot = classification && SHOW_DOT_FOR.has(classification);

      return {
        index,
        score,
        height,
        classification,
        showDot,
        isWhiteMove: index % 2 === 0,
      };
    });
  }, [moves]);

  // Calculate bar width based on container width and number of moves
  const barWidth = useMemo(() => {
    if (moves.length === 0 || containerWidth === 0) return 8;
    const maxWidth = 12;
    const minWidth = 3;
    const calculatedWidth = (containerWidth - 16) / moves.length; // Account for padding
    return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
  }, [moves.length, containerWidth]);

  const histogramHeight = 60;
  const centerY = histogramHeight / 2;

  if (moves.length === 0) {
    return (
      <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700">
        <div className="text-stone-500 text-sm italic text-center py-2">
          No moves to display
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-800/50 rounded-lg border border-stone-700 overflow-hidden">
      {/* Histogram container */}
      <div
        ref={containerRef}
        className="relative px-2 py-2 cursor-pointer"
        style={{ height: histogramHeight + 12 }}
      >
        {/* Center line (equal position) */}
        <div
          className="absolute left-2 right-2 border-t border-stone-600/50"
          style={{ top: centerY + 6 }}
        />

        {/* Bars container */}
        <div className="flex items-center justify-start gap-px h-full">
          {barData.map((bar) => {
            const isActive = bar.index === currentMoveIndex;
            const barHeight = Math.abs(bar.height - 0.5) * histogramHeight;
            const isPositive = bar.height > 0.5;

            return (
              <div
                key={bar.index}
                className="relative flex flex-col items-center justify-center group"
                style={{
                  width: barWidth,
                  height: histogramHeight,
                }}
                onClick={() => onMoveClick(bar.index)}
              >
                {/* Evaluation bar */}
                <div
                  className={`
                    absolute transition-all duration-150
                    ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}
                  `}
                  style={{
                    width: barWidth - 1,
                    height: Math.max(2, barHeight),
                    backgroundColor: isPositive
                      ? "rgba(255, 255, 255, 0.85)"
                      : "rgba(38, 38, 38, 0.9)",
                    top: isPositive ? centerY - barHeight : centerY,
                    borderRadius: 1,
                    border: isPositive
                      ? "none"
                      : "1px solid rgba(120, 113, 108, 0.3)",
                  }}
                />

                {/* Classification dot */}
                {bar.showDot && bar.classification && (
                  <div
                    className="absolute z-10 rounded-full shadow-lg"
                    style={{
                      width: Math.max(6, barWidth - 2),
                      height: Math.max(6, barWidth - 2),
                      backgroundColor: CLASSIFICATION_COLORS[bar.classification],
                      top: isPositive
                        ? centerY - barHeight - 4
                        : centerY + barHeight - 2,
                      boxShadow: `0 0 4px ${CLASSIFICATION_COLORS[bar.classification]}60`,
                    }}
                  />
                )}

                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{
                      borderLeft: "4px solid transparent",
                      borderRight: "4px solid transparent",
                      borderBottom: "5px solid #f59e0b",
                    }}
                  />
                )}

                {/* Hover tooltip */}
                <div
                  className={`
                    absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 
                    bg-stone-900 border border-stone-700 rounded text-xs 
                    whitespace-nowrap opacity-0 group-hover:opacity-100 
                    transition-opacity pointer-events-none z-20
                  `}
                >
                  <span className="text-stone-300">
                    {Math.floor(bar.index / 2) + 1}
                    {bar.isWhiteMove ? "." : "..."}{" "}
                  </span>
                  <span
                    className={
                      bar.score >= 0 ? "text-stone-100" : "text-stone-400"
                    }
                  >
                    {bar.score >= 0 ? "+" : ""}
                    {(bar.score / 100).toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Evaluation scale labels */}
        <div className="absolute right-2 top-1 text-[9px] text-stone-500 font-mono">
          +
        </div>
        <div className="absolute right-2 bottom-1 text-[9px] text-stone-500 font-mono">
          −
        </div>
      </div>

      {/* Legend */}
      <div className="px-2 py-1.5 border-t border-stone-700/50 bg-stone-900/30">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <LegendItem color={CLASSIFICATION_COLORS.brilliant} label="Brilliant" />
          <LegendItem color={CLASSIFICATION_COLORS.best} label="Best" />
          <LegendItem color={CLASSIFICATION_COLORS.inaccuracy} label="Inaccuracy" />
          <LegendItem color={CLASSIFICATION_COLORS.mistake} label="Mistake" />
          <LegendItem color={CLASSIFICATION_COLORS.blunder} label="Blunder" />
        </div>
      </div>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
}

function LegendItem({ color, label }: LegendItemProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-stone-500">{label}</span>
    </div>
  );
}

