import { useMemo } from "react";
import { Chess } from "chess.js";
import type { EngineLine } from "../../types/chess";

interface EngineLinesProps {
  lines: EngineLine[];
  isAnalyzing: boolean;
  engineReady?: boolean;
  depth?: number;
  fen?: string; // Current position FEN for converting UCI to SAN
}

// Piece icons for display
const PIECE_ICONS: Record<string, string> = {
  k: "♔",
  q: "♕",
  r: "♖",
  b: "♗",
  n: "♘",
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
};

/**
 * Convert UCI move notation to readable format with piece icons
 * e.g., "e2e4" -> "e4", "g1f3" -> "♘f3", "e1g1" -> "O-O"
 */
function uciToReadable(uciMoves: string[], fen: string): string[] {
  try {
    const chess = new Chess(fen);
    const readableMoves: string[] = [];
    
    for (const uci of uciMoves) {
      try {
        // Parse UCI move (e.g., "e2e4", "g1f3", "e7e8q")
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = uci.length > 4 ? uci[4] : undefined;
        
        // Make the move and get SAN
        const move = chess.move({ from, to, promotion });
        if (move) {
          // Add piece icon for non-pawn moves
          let displayMove = move.san;
          const pieceChar = move.san[0];
          if (PIECE_ICONS[pieceChar]) {
            displayMove = PIECE_ICONS[pieceChar] + move.san.slice(1);
          }
          readableMoves.push(displayMove);
        } else {
          // Fallback to UCI if move fails
          readableMoves.push(uci);
        }
      } catch {
        // If move fails, use UCI notation
        readableMoves.push(uci);
        break; // Can't continue without valid position
      }
    }
    
    return readableMoves;
  } catch {
    // If FEN is invalid, return original moves
    return uciMoves;
  }
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
  fen = "",
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
            <EngineLineRow key={line.id} line={line} rank={line.id} fen={fen} />
          ))}
        </div>
      )}
    </div>
  );
}

interface EngineLineRowProps {
  line: EngineLine;
  rank: number;
  fen: string;
}

function EngineLineRow({ line, rank, fen }: EngineLineRowProps): React.ReactElement {
  const { evaluation, moves } = line;
  const isPositive = evaluation.mate !== null ? evaluation.mate > 0 : evaluation.score >= 0;

  // Convert UCI moves to readable SAN with piece icons
  const readableMoves = useMemo(() => {
    if (!fen || moves.length === 0) return moves;
    return uciToReadable(moves, fen);
  }, [moves, fen]);

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

      {/* Move sequence with piece icons */}
      <div className="flex-1 text-sm text-stone-300 truncate group-hover:whitespace-normal group-hover:break-words">
        {readableMoves.slice(0, 8).map((move, idx) => (
          <span key={idx} className={idx % 2 === 0 ? "text-stone-200" : "text-stone-400"}>
            {move}
            {idx < Math.min(readableMoves.length, 8) - 1 && " "}
          </span>
        ))}
        {readableMoves.length > 8 && (
          <span className="text-stone-500"> ...</span>
        )}
      </div>
    </div>
  );
}

