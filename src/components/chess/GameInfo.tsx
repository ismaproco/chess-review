import {
  ClockIcon,
  CalendarIcon,
  TrophyIcon,
  LinkIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import type { PGNHeaders, GameResult } from "../../types/chess";
import {
  formatTimeControl,
  formatPGNDate,
  getTimeControlCategory,
} from "../../types/chess";

interface GameInfoProps {
  headers: PGNHeaders;
  result: GameResult;
}

export function GameInfo({ headers, result }: GameInfoProps): React.ReactElement {
  const timeControlCategory = getTimeControlCategory(headers.timeControl);
  const formattedDate = formatPGNDate(headers.date);
  const formattedTimeControl = formatTimeControl(headers.timeControl);

  const getResultDisplay = (): { text: string; winner: "white" | "black" | "draw" | null } => {
    switch (result) {
      case "1-0":
        return { text: "White wins", winner: "white" };
      case "0-1":
        return { text: "Black wins", winner: "black" };
      case "1/2-1/2":
        return { text: "Draw", winner: "draw" };
      default:
        return { text: "In progress", winner: null };
    }
  };

  const resultDisplay = getResultDisplay();

  return (
    <div className="bg-stone-800/50 rounded-xl border border-stone-700 overflow-hidden">
      {/* Players Section */}
      <div className="p-4 space-y-3">
        {/* White Player */}
        <PlayerRow
          color="white"
          name={headers.white || "Unknown"}
          elo={headers.whiteElo}
          isWinner={resultDisplay.winner === "white"}
        />

        {/* Result indicator */}
        <div className="flex items-center justify-center">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              resultDisplay.winner === "white"
                ? "bg-white/10 text-white"
                : resultDisplay.winner === "black"
                ? "bg-stone-600/50 text-stone-300"
                : resultDisplay.winner === "draw"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-stone-700 text-stone-400"
            }`}
          >
            {result}
          </div>
        </div>

        {/* Black Player */}
        <PlayerRow
          color="black"
          name={headers.black || "Unknown"}
          elo={headers.blackElo}
          isWinner={resultDisplay.winner === "black"}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-stone-700" />

      {/* Game Details */}
      <div className="p-4 grid grid-cols-2 gap-3 text-sm">
        {/* Time Control */}
        <InfoItem
          icon={<ClockIcon className="w-4 h-4" />}
          label={timeControlCategory}
          value={formattedTimeControl}
        />

        {/* Date */}
        <InfoItem
          icon={<CalendarIcon className="w-4 h-4" />}
          label="Date"
          value={formattedDate}
        />

        {/* Event */}
        {headers.event && (
          <InfoItem
            icon={<TrophyIcon className="w-4 h-4" />}
            label="Event"
            value={headers.event}
          />
        )}

        {/* Site */}
        {headers.site && (
          <InfoItem
            icon={<MapPinIcon className="w-4 h-4" />}
            label="Site"
            value={headers.site}
          />
        )}

        {/* Opening */}
        {(headers.eco || headers.opening) && (
          <InfoItem
            icon={<span className="text-xs font-bold">ECO</span>}
            label="Opening"
            value={headers.eco || headers.opening || ""}
            fullWidth={Boolean(headers.opening)}
          />
        )}
      </div>

      {/* Termination */}
      {headers.termination && (
        <>
          <div className="border-t border-stone-700" />
          <div className="px-4 py-3">
            <p className="text-xs text-stone-400 text-center">
              {headers.termination}
            </p>
          </div>
        </>
      )}

      {/* Game Link */}
      {headers.link && (
        <>
          <div className="border-t border-stone-700" />
          <a
            href={headers.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-amber-500 hover:text-amber-400 hover:bg-stone-700/50 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            View on {extractSiteName(headers.link)}
          </a>
        </>
      )}
    </div>
  );
}

interface PlayerRowProps {
  color: "white" | "black";
  name: string;
  elo?: string;
  isWinner: boolean;
}

function PlayerRow({ color, name, elo, isWinner }: PlayerRowProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      {/* Color indicator */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-md ${
          color === "white"
            ? "bg-gradient-to-br from-white to-stone-200 text-stone-800"
            : "bg-gradient-to-br from-stone-700 to-stone-800 text-white border border-stone-600"
        }`}
      >
        ♔
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold truncate ${
              isWinner ? "text-amber-400" : "text-stone-200"
            }`}
          >
            {name}
          </span>
          {isWinner && (
            <TrophyIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
        </div>
        {elo && (
          <span className="text-xs text-stone-500">ELO: {elo}</span>
        )}
      </div>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullWidth?: boolean;
}

function InfoItem({ icon, label, value, fullWidth }: InfoItemProps): React.ReactElement {
  return (
    <div className={`flex items-start gap-2 ${fullWidth ? "col-span-2" : ""}`}>
      <div className="text-stone-500 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-stone-300 truncate">{value}</p>
      </div>
    </div>
  );
}

function extractSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes("chess.com")) return "Chess.com";
    if (hostname.includes("lichess")) return "Lichess";
    if (hostname.includes("chess24")) return "Chess24";
    return hostname.replace("www.", "");
  } catch {
    return "source";
  }
}

