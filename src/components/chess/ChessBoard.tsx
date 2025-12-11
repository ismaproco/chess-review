import { ChessPiece } from "./ChessPiece";
import type { Square, Piece, Color } from "../../types/chess";

interface ChessBoardProps {
  position: Map<Square, Piece>;
  orientation?: Color;
  lastMove?: { from: Square; to: Square } | null;
  selectedSquare?: Square | null;
  onSquareClick?: (square: Square) => void;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

function getSquareColor(file: number, rank: number): "light" | "dark" {
  return (file + rank) % 2 === 0 ? "dark" : "light";
}

export function ChessBoard({
  position,
  orientation = "w",
  lastMove,
  selectedSquare,
  onSquareClick,
}: ChessBoardProps): React.ReactElement {
  const files = orientation === "w" ? FILES : [...FILES].reverse();
  const ranks = orientation === "w" ? RANKS : [...RANKS].reverse();

  return (
    <div className="relative select-none">
      <div className="grid grid-cols-8 border-2 border-stone-800 rounded-sm shadow-2xl overflow-hidden">
        {ranks.map((rank, rankIdx) =>
          files.map((file, fileIdx) => {
            const square = `${file}${rank}` as Square;
            const piece = position.get(square);
            const squareColor = getSquareColor(fileIdx, rankIdx);
            const isLastMoveSquare =
              lastMove && (lastMove.from === square || lastMove.to === square);
            const isSelected = selectedSquare === square;

            const lightSquare = "bg-amber-100";
            const darkSquare = "bg-emerald-700";
            const highlightLight = "bg-yellow-300";
            const highlightDark = "bg-yellow-500";

            let bgClass = squareColor === "light" ? lightSquare : darkSquare;
            if (isLastMoveSquare) {
              bgClass = squareColor === "light" ? highlightLight : highlightDark;
            }
            if (isSelected) {
              bgClass = "bg-blue-400";
            }

            return (
              <div
                key={square}
                className={`
                  relative aspect-square flex items-center justify-center
                  ${bgClass}
                  cursor-pointer
                  transition-colors duration-150
                  hover:brightness-110
                `}
                onClick={() => onSquareClick?.(square)}
              >
                {/* File label on bottom row */}
                {rankIdx === 7 && (
                  <span
                    className={`
                      absolute bottom-0.5 right-1 text-[10px] font-semibold z-10
                      ${squareColor === "light" ? "text-emerald-700" : "text-amber-100"}
                    `}
                  >
                    {file}
                  </span>
                )}
                {/* Rank label on leftmost column */}
                {fileIdx === 0 && (
                  <span
                    className={`
                      absolute top-0.5 left-1 text-[10px] font-semibold z-10
                      ${squareColor === "light" ? "text-emerald-700" : "text-amber-100"}
                    `}
                  >
                    {rank}
                  </span>
                )}
                {/* Piece */}
                {piece && (
                  <div className="w-[85%] h-[85%] transition-transform duration-150 hover:scale-105 drop-shadow-md">
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
