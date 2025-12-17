import { useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Volume2, VolumeX } from "lucide-react";

interface AdaptiveSettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
}

interface ReadingBoxProps {
  text: string;
  settings: AdaptiveSettings;
  isAdapted: boolean;
  isReading: boolean;
  onStartReading: () => void;
  onStopReading: () => void;
  onProgressUpdate: (scrollPercent: number) => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
}

export const ReadingBox = ({
  text,
  settings,
  isAdapted,
  isReading,
  onStartReading,
  onStopReading,
  onProgressUpdate,
  isSpeaking,
  onToggleSpeech,
}: ReadingBoxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Track scroll position to estimate reading progress
   * - Calculates percentage of content scrolled
   * - Reports to parent for WPM calculation
   */
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 1;
    
    onProgressUpdate(Math.min(scrollPercent, 1));
  }, [onProgressUpdate]);

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container && isReading) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [isReading, handleScroll]);

  // Dynamic styles based on adaptive settings
  const textStyles = {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    letterSpacing: `${settings.letterSpacing}em`,
    wordSpacing: `${settings.wordSpacing}em`,
  };

  return (
    <section className="space-y-4" aria-label="Reading area">
      {/* Reading Container */}
      <div
        ref={containerRef}
        className={`reading-container transition-all duration-500 ease-out ${
          isAdapted ? "adapted" : ""
        }`}
      >
        <div
          className="reading-text text-reading-text max-h-[400px] overflow-y-auto pr-4 scroll-smooth"
          style={textStyles}
        >
          {/* Split text into paragraphs for better structure */}
          {text.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-6 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 justify-center">
        {!isReading ? (
          <Button
            onClick={onStartReading}
            size="lg"
            className="gap-2 shadow-button hover:shadow-lg transition-shadow"
          >
            <Play className="w-5 h-5" />
            Start Reading
          </Button>
        ) : (
          <Button
            onClick={onStopReading}
            size="lg"
            variant="secondary"
            className="gap-2"
          >
            <Square className="w-5 h-5" />
            Stop Reading
          </Button>
        )}

        <Button
          onClick={onToggleSpeech}
          variant="outline"
          size="lg"
          className="gap-2"
          aria-label={isSpeaking ? "Stop reading aloud" : "Read aloud"}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-5 h-5" />
              Stop Audio
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              Read Aloud
            </>
          )}
        </Button>
      </div>

      {/* Adaptation Indicator */}
      {isAdapted && (
        <p className="text-center text-sm text-muted-foreground animate-fade-in">
          Text has been adapted for easier reading based on your speed.
        </p>
      )}
    </section>
  );
};
