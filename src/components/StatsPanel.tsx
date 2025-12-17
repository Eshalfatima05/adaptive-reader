import { Clock, BookOpen, Gauge, Target } from "lucide-react";

interface StatsPanelProps {
  currentWPM: number;
  wordsRead: number;
  totalWords: number;
  sessionTime: number;
  speedStatus: "neutral" | "good" | "slow" | "critical";
  isReading: boolean;
}

export const StatsPanel = ({
  currentWPM,
  wordsRead,
  totalWords,
  sessionTime,
  speedStatus,
  isReading,
}: StatsPanelProps) => {
  /**
   * Format seconds into MM:SS display
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Get CSS class for speed indicator
   */
  const getSpeedClass = () => {
    switch (speedStatus) {
      case "good":
        return "speed-good";
      case "slow":
        return "speed-slow";
      case "critical":
        return "speed-critical";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  /**
   * Get speed description for accessibility
   */
  const getSpeedLabel = () => {
    switch (speedStatus) {
      case "good":
        return "Good pace";
      case "slow":
        return "Adapting...";
      case "critical":
        return "Fully adapted";
      default:
        return "Ready";
    }
  };

  const progress = totalWords > 0 ? (wordsRead / totalWords) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Reading statistics">
      {/* Reading Speed */}
      <div className="bg-card rounded-xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Gauge className="w-4 h-4" />
          <span className="text-sm font-medium">Speed</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">
            {currentWPM}
          </span>
          <span className="text-sm text-muted-foreground">WPM</span>
        </div>
        <div className={`speed-indicator mt-2 ${getSpeedClass()}`}>
          {getSpeedLabel()}
        </div>
      </div>

      {/* Words Read */}
      <div className="bg-card rounded-xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Progress</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">
            {wordsRead}
          </span>
          <span className="text-sm text-muted-foreground">/ {totalWords}</span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Session Time */}
      <div className="bg-card rounded-xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Time</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground font-mono">
            {formatTime(sessionTime)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {isReading ? "Reading..." : "Paused"}
        </p>
      </div>

      {/* Target Speed */}
      <div className="bg-card rounded-xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">Target</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">120+</span>
          <span className="text-sm text-muted-foreground">WPM</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Comfortable pace</p>
      </div>
    </div>
  );
};
