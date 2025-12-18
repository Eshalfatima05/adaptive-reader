import { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Volume2, VolumeX, ChevronRight, RotateCcw, Focus } from "lucide-react";
import { FocusGuide } from "./FocusGuide";

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
  onParagraphComplete: (wordsInParagraph: number, timeMs: number) => void;
  onReset: () => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onCheckWPM?: (wordsInParagraph: number, timeMs: number) => void;
}

export const ReadingBox = ({
  text,
  settings,
  isAdapted,
  isReading,
  onStartReading,
  onStopReading,
  onParagraphComplete,
  onReset,
  isSpeaking,
  onToggleSpeech,
  onCheckWPM,
}: ReadingBoxProps) => {
  // Focus guide state
  const [focusGuideEnabled, setFocusGuideEnabled] = useState(false);
  const readingContainerRef = useRef<HTMLDivElement>(null);
  // Split text into paragraphs
  const paragraphs = text.split("\n\n").filter(p => p.trim().length > 0);
  
  // Track current paragraph index
  const [currentParagraph, setCurrentParagraph] = useState(0);
  
  // Track time when current paragraph started
  const paragraphStartTime = useRef<number>(0);
  
  // Timer for periodic WPM check
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isComplete = currentParagraph >= paragraphs.length;

  /**
   * Periodic WPM check - runs every 3 seconds while reading
   * This allows adaptation to happen during reading, not just after
   */
  useEffect(() => {
    if (isReading && !isComplete && onCheckWPM && paragraphStartTime.current > 0) {
      // Check WPM every 3 seconds
      checkIntervalRef.current = setInterval(() => {
        const timeSpent = Date.now() - paragraphStartTime.current;
        const wordsInParagraph = paragraphs[currentParagraph]
          ?.trim()
          .split(/\s+/)
          .filter(w => w.length > 0).length || 0;
        
        // Only check if at least 2 seconds have passed (to avoid instant adaptation)
        if (timeSpent >= 2000 && wordsInParagraph > 0) {
          onCheckWPM(wordsInParagraph, timeSpent);
        }
      }, 3000);
    }
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isReading, isComplete, currentParagraph, paragraphs, onCheckWPM]);

  /**
   * Start reading the first paragraph
   */
  const handleStart = useCallback(() => {
    setCurrentParagraph(0);
    paragraphStartTime.current = Date.now();
    onStartReading();
  }, [onStartReading]);

  /**
   * User finished reading current paragraph - move to next
   * This triggers WPM calculation based on actual reading time
   */
  const handleNextParagraph = useCallback(() => {
    if (currentParagraph >= paragraphs.length) return;
    
    // Calculate time spent on this paragraph
    const timeSpent = Date.now() - paragraphStartTime.current;
    
    // Count words in this paragraph
    const wordsInParagraph = paragraphs[currentParagraph]
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;
    
    // Report to parent for WPM calculation
    onParagraphComplete(wordsInParagraph, timeSpent);
    
    // Move to next paragraph
    const nextIndex = currentParagraph + 1;
    setCurrentParagraph(nextIndex);
    
    // Reset timer for next paragraph
    paragraphStartTime.current = Date.now();
    
    // If we've read all paragraphs, stop
    if (nextIndex >= paragraphs.length) {
      onStopReading();
    }
  }, [currentParagraph, paragraphs, onParagraphComplete, onStopReading]);

  /**
   * Reset reading to start
   */
  const handleReset = useCallback(() => {
    setCurrentParagraph(0);
    paragraphStartTime.current = 0;
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    onReset();
  }, [onReset]);

  // Dynamic styles based on adaptive settings - applies immediately when settings change
  const textStyles = {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    letterSpacing: `${settings.letterSpacing}em`,
    wordSpacing: `${settings.wordSpacing}em`,
  };

  // Calculate progress
  const progressPercent = paragraphs.length > 0 
    ? Math.round((currentParagraph / paragraphs.length) * 100) 
    : 0;

  return (
    <section className="space-y-4" aria-label="Reading area">
      {/* Progress Bar */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Paragraph {Math.min(currentParagraph + 1, paragraphs.length)} of {paragraphs.length}</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span>{progressPercent}%</span>
      </div>

      {/* Reading Container */}
      <div
        ref={readingContainerRef}
        className={`reading-container transition-all duration-500 ease-out min-h-[200px] relative ${
          isAdapted ? "adapted ring-2 ring-primary/20" : ""
        }`}
      >
        <FocusGuide enabled={focusGuideEnabled && isReading} containerRef={readingContainerRef} />
        
        {!isReading && currentParagraph === 0 ? (
          // Show preview of first paragraph before starting
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Click "Start Reading" to begin. Click "Next" after reading each paragraph.
            </p>
            <p className="reading-text text-reading-text italic" style={{ fontSize: '16px' }}>
              Preview: "{paragraphs[0]?.substring(0, 100)}..."
            </p>
          </div>
        ) : isComplete ? (
          // Completion message
          <div className="text-center py-12">
            <h3 className="text-2xl font-semibold text-foreground mb-2">Reading Complete!</h3>
            <p className="text-muted-foreground">
              Great job! Check your stats above to see your reading speed.
            </p>
          </div>
        ) : (
          // Show current paragraph with adaptive styles
          <div
            className="reading-text text-reading-text transition-all duration-300"
            style={textStyles}
          >
            <p className="leading-relaxed">{paragraphs[currentParagraph]}</p>
          </div>
        )}
      </div>

      {/* Adaptation Indicator */}
      {isAdapted && isReading && (
        <div className="bg-accent/50 text-accent-foreground rounded-lg p-3 text-center text-sm animate-fade-in">
          <strong>Auto-adapted:</strong> Font size and spacing increased to help with reading.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 justify-center">
        {!isReading && currentParagraph === 0 ? (
          <Button
            onClick={handleStart}
            size="lg"
            className="gap-2 shadow-button hover:shadow-lg transition-shadow"
          >
            <Play className="w-5 h-5" />
            Start Reading
          </Button>
        ) : isReading && !isComplete ? (
          <>
            <Button
              onClick={handleNextParagraph}
              size="lg"
              className="gap-2 shadow-button hover:shadow-lg transition-shadow animate-pulse-gentle"
            >
              <ChevronRight className="w-5 h-5" />
              Next Paragraph
            </Button>
            <Button
              onClick={onStopReading}
              size="lg"
              variant="secondary"
              className="gap-2"
            >
              <Square className="w-5 h-5" />
              Stop
            </Button>
          </>
        ) : (
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Read Again
          </Button>
        )}

        <Button
          onClick={() => setFocusGuideEnabled(!focusGuideEnabled)}
          variant={focusGuideEnabled ? "default" : "outline"}
          size="lg"
          className="gap-2"
          aria-label={focusGuideEnabled ? "Disable focus guide" : "Enable focus guide"}
        >
          <Focus className="w-5 h-5" />
          {focusGuideEnabled ? "Guide On" : "Focus Guide"}
        </Button>

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
    </section>
  );
};
