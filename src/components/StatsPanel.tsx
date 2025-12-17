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
   * 
   * Visual feedback helps users understand their pace:
   * - Green (good): Comfortable reading speed (120+ WPM)
   * - Orange (slow): May benefit from adaptations (80-119 WPM)
   * - Red (critical): Struggling, adaptations applied (<80 WPM)
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
   * Get speed description for accessibility and user feedback
   */
  const getSpeedLabel = () => {
    switch (speedStatus) {
      case "good":
        return "Good pace!";
      case "slow":
        return "Adapting text...";
      case "critical":
        return "Text adapted";
      default:
        return "Ready";
    }
  };

  const progress = totalWords > 0 ? (wordsRead / totalWords) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Reading statistics">
      {/* Reading Speed - THE KEY METRIC */}
      <div className="bg-card rounded-xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Gauge className="w-4 h-4" />
          <span className="text-sm font-medium">Speed (WPM)</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">
            {currentWPM}
          </span>
        </div>
        <div className={`speed-indicator mt-2 ${getSpeedClass()}`}>
          {getSpeedLabel()}
        </div>
      </div>

      {/* Words Read - Shows actual progress through text */}
      <div className="bg-card rounded-xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Words Read</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">
            {wordsRead}
          </span>
          <span className="text-sm text-muted-foreground">/ {totalWords}</span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
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
          <span className="text-3xl font-bold text-foreground font-mono">
            {formatTime(sessionTime)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {isReading ? "Reading..." : sessionTime > 0 ? "Paused" : "Not started"}
        </p>
      </div>

      {/* Target Speed - Educational reference */}
      <div className="bg-card rounded-xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">Thresholds</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-speed-good">Good:</span>
            <span className="font-medium">120+ WPM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-speed-slow">Adapt:</span>
            <span className="font-medium">80-119</span>
          </div>
          <div className="flex justify-between">
            <span className="text-speed-critical">Critical:</span>
            <span className="font-medium">&lt;80 WPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
