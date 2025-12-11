import type { EngineLine } from "../../types/chess";

interface EngineLinesProps {
  lines: EngineLine[];
  isAnalyzing: boolean;
  engineReady?: boolean;
  depth?: number;
}

function formatScore(score: number, mate: number | null): string {
  if (mate !== null) {
    return mate > 0 ? `#${mate}` : `#${mate}`;
  }
  const absScore = Math.abs(score / 100);
  return score >= 0 ? `+${absScore.toFixed(2)}` : `-${absScore.toFixed(2)}`;
}

export function EngineLines({
  lines,
  isAnalyzing,
  engineReady = true,
  depth = 0,
}: EngineLinesProps): React.ReactElement {
  return (
    <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wide">
            Stockfish 17
          </h3>
          {depth > 0 && (
            <span className="text-xs text-stone-500 font-mono">
              depth {depth}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!engineReady ? (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs text-stone-400">Loading engine...</span>
            </>
          ) : isAnalyzing ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-stone-400">Analyzing...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-stone-500 rounded-full" />
              <span className="text-xs text-stone-500">Ready</span>
            </>
          )}
        </div>
      </div>

      {!engineReady ? (
        <div className="text-stone-500 text-sm italic py-4 text-center">
          Initializing Stockfish engine...
        </div>
      ) : lines.length === 0 ? (
        <div className="text-stone-500 text-sm italic py-4 text-center">
          {isAnalyzing ? "Calculating..." : "No analysis available"}
        </div>
      ) : (
        <div className="space-y-2">
          {lines.map((line) => (
            <EngineLineRow key={line.id} line={line} rank={line.id} />
          ))}
        </div>
      )}
    </div>
  );
}

interface EngineLineRowProps {
  line: EngineLine;
  rank: number;
}

function EngineLineRow({ line, rank }: EngineLineRowProps): React.ReactElement {
  const { evaluation, moves } = line;
  const isPositive = evaluation.mate !== null ? evaluation.mate > 0 : evaluation.score >= 0;

  return (
    <div className="flex items-start gap-2 group">
      {/* Rank indicator */}
      <div className="w-5 h-5 rounded bg-stone-700 flex items-center justify-center shrink-0">
        <span className="text-xs text-stone-400">{rank}</span>
      </div>

      {/* Score */}
      <div
        className={`
          w-16 shrink-0 px-2 py-0.5 rounded text-sm font-mono font-semibold text-center
          ${isPositive ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-stone-100 border border-stone-600"}
        `}
      >
        {formatScore(evaluation.score, evaluation.mate)}
      </div>

      {/* Depth */}
      <div className="text-xs text-stone-500 shrink-0 w-10">
        d{evaluation.depth}
      </div>

      {/* Move sequence */}
      <div className="flex-1 text-sm text-stone-300 font-mono truncate group-hover:whitespace-normal group-hover:break-words">
        {moves.slice(0, 8).join(" ")}
        {moves.length > 8 && (
          <span className="text-stone-500"> ...</span>
        )}
      </div>
    </div>
  );
}

