import type { MoveWithEval, MoveClassification } from "../../types/chess";

interface MoveListProps {
  moves: MoveWithEval[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: "text-cyan-400 bg-cyan-950",
  great: "text-blue-400 bg-blue-950",
  best: "text-green-400 bg-green-950",
  excellent: "text-green-300 bg-green-950",
  good: "text-lime-400 bg-lime-950",
  book: "text-stone-400 bg-stone-800",
  inaccuracy: "text-yellow-400 bg-yellow-950",
  mistake: "text-orange-400 bg-orange-950",
  blunder: "text-red-400 bg-red-950",
  missed_win: "text-red-300 bg-red-950",
};

const CLASSIFICATION_SYMBOLS: Record<MoveClassification, string> = {
  brilliant: "!!",
  great: "!",
  best: "★",
  excellent: "✓",
  good: "",
  book: "📖",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
  missed_win: "×",
};

export function MoveList({
  moves,
  currentMoveIndex,
  onMoveClick,
}: MoveListProps): React.ReactElement {
  // Group moves into pairs (white, black)
  const movePairs: Array<{
    moveNumber: number;
    white?: { move: MoveWithEval; index: number };
    black?: { move: MoveWithEval; index: number };
  }> = [];

  for (let i = 0; i < moves.length; i++) {
    const moveNumber = Math.floor(i / 2) + 1;
    const isWhite = i % 2 === 0;

    if (isWhite) {
      movePairs.push({
        moveNumber,
        white: { move: moves[i], index: i },
      });
    } else {
      const lastPair = movePairs[movePairs.length - 1];
      if (lastPair) {
        lastPair.black = { move: moves[i], index: i };
      }
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
      <div className="p-2 space-y-0.5">
        {/* Starting position */}
        <button
          className={`
            w-full text-left px-2 py-1 rounded text-sm font-mono
            transition-colors duration-150
            ${currentMoveIndex === -1
              ? "bg-amber-600 text-white"
              : "text-stone-400 hover:bg-stone-700"
            }
          `}
          onClick={() => onMoveClick(-1)}
        >
          Start
        </button>

        {movePairs.map(({ moveNumber, white, black }) => (
          <div key={moveNumber} className="flex items-center gap-1">
            {/* Move number */}
            <span className="w-8 text-stone-500 text-sm font-mono text-right shrink-0">
              {moveNumber}.
            </span>

            {/* White's move */}
            {white && (
              <MoveButton
                san={white.move.san}
                classification={white.move.classification}
                isActive={currentMoveIndex === white.index}
                onClick={() => onMoveClick(white.index)}
              />
            )}

            {/* Black's move */}
            {black && (
              <MoveButton
                san={black.move.san}
                classification={black.move.classification}
                isActive={currentMoveIndex === black.index}
                onClick={() => onMoveClick(black.index)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MoveButtonProps {
  san: string;
  classification?: MoveClassification;
  isActive: boolean;
  onClick: () => void;
}

function MoveButton({
  san,
  classification,
  isActive,
  onClick,
}: MoveButtonProps): React.ReactElement {
  const classificationStyle = classification
    ? CLASSIFICATION_COLORS[classification]
    : "";
  const symbol = classification ? CLASSIFICATION_SYMBOLS[classification] : "";

  return (
    <button
      className={`
        flex-1 px-2 py-1 rounded text-sm font-mono text-left
        transition-colors duration-150
        ${isActive
          ? "bg-amber-600 text-white font-semibold"
          : classificationStyle || "text-stone-200 hover:bg-stone-700"
        }
      `}
      onClick={onClick}
    >
      {san}
      {symbol && <span className="ml-1 text-xs">{symbol}</span>}
    </button>
  );
}

