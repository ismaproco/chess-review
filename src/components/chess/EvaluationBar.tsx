interface EvaluationBarProps {
  evaluation: number; // Centipawns from white's perspective
  mate: number | null; // Mate in X moves
  orientation?: "w" | "b";
}

function formatEvaluation(evaluation: number, mate: number | null): string {
  if (mate !== null) {
    return mate > 0 ? `M${mate}` : `M${Math.abs(mate)}`;
  }
  const eval_display = Math.abs(evaluation / 100).toFixed(1);
  return evaluation >= 0 ? `+${eval_display}` : `-${eval_display}`;
}

function getBarPercentage(evaluation: number, mate: number | null): number {
  if (mate !== null) {
    // Mate: show extreme advantage
    return mate > 0 ? 95 : 5;
  }
  
  // Convert centipawns to percentage (capped)
  // Using a sigmoid-like function for better visual distribution
  const maxEval = 1000; // Cap at +/- 10 pawns
  const clampedEval = Math.max(-maxEval, Math.min(maxEval, evaluation));
  const percentage = 50 + (clampedEval / maxEval) * 45;
  return Math.max(5, Math.min(95, percentage));
}

export function EvaluationBar({
  evaluation,
  mate,
  orientation = "w",
}: EvaluationBarProps): React.ReactElement {
  const whitePercentage = getBarPercentage(evaluation, mate);
  const displayPercentage = orientation === "w" ? whitePercentage : 100 - whitePercentage;
  const evalText = formatEvaluation(evaluation, mate);
  const isWhiteAdvantage = mate !== null ? mate > 0 : evaluation >= 0;

  return (
    <div className="relative h-full w-8 bg-stone-900 rounded-sm overflow-hidden shadow-inner border border-stone-700">
      {/* White portion (from bottom) */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-100 to-white transition-all duration-500 ease-out"
        style={{ height: `${displayPercentage}%` }}
      />
      
      {/* Evaluation text */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 text-[10px] font-bold
          px-0.5 py-0.5 rounded
          ${isWhiteAdvantage 
            ? "top-1 text-white bg-stone-900/70" 
            : "bottom-1 text-stone-900 bg-white/70"
          }
        `}
      >
        {evalText}
      </div>
    </div>
  );
}

