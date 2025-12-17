import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { ReadingBox } from "@/components/ReadingBox";
import { ControlPanel } from "@/components/ControlPanel";
import { StatsPanel } from "@/components/StatsPanel";
import { StudyMode } from "@/components/StudyMode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap } from "lucide-react";

// Sample text for reading practice
const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog near the riverbank. Reading is a fundamental skill that opens doors to knowledge and imagination. When we read, our brains process visual information and convert it into meaningful concepts.

Every person has a unique reading style and pace. Some prefer to read slowly and carefully, savoring each word. Others skim quickly to get the main ideas. Both approaches are valid and serve different purposes.

Research shows that comfortable reading environments can significantly improve comprehension. Good lighting, appropriate font sizes, and adequate spacing between lines all contribute to a better reading experience. Taking regular breaks also helps maintain focus and reduce eye strain.

The art of reading has evolved over centuries. From ancient scrolls to modern digital screens, humans have always found ways to share knowledge through written words. Today, technology offers new opportunities to make reading more accessible to everyone.`;

/**
 * Reading speed thresholds (Words Per Minute)
 * - Good: 120+ WPM (comfortable reading)
 * - Slow: 80-120 WPM (may need some assistance)
 * - Critical: <80 WPM (needs full adaptation)
 */
const WPM_THRESHOLD_GOOD = 120;
const WPM_THRESHOLD_SLOW = 80;

// Adaptive settings applied when reading speed drops
interface AdaptiveSettings {
  fontSize: number;      // Base font size in pixels
  lineHeight: number;    // Line height multiplier
  letterSpacing: number; // Letter spacing in em
  wordSpacing: number;   // Word spacing in em
}

const DEFAULT_SETTINGS: AdaptiveSettings = {
  fontSize: 18,
  lineHeight: 1.6,
  letterSpacing: 0,
  wordSpacing: 0,
};

const ADAPTED_SETTINGS: AdaptiveSettings = {
  fontSize: 22,
  lineHeight: 2,
  letterSpacing: 0.05,
  wordSpacing: 0.1,
};

const CRITICAL_SETTINGS: AdaptiveSettings = {
  fontSize: 26,
  lineHeight: 2.4,
  letterSpacing: 0.08,
  wordSpacing: 0.15,
};

const Index = () => {
  // Reading state
  const [text, setText] = useState(SAMPLE_TEXT);
  const [isReading, setIsReading] = useState(false);
  const [wordsRead, setWordsRead] = useState(0);
  const [currentWPM, setCurrentWPM] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  
  // Adaptive settings
  const [settings, setSettings] = useState<AdaptiveSettings>(DEFAULT_SETTINGS);
  const [isAdapted, setIsAdapted] = useState(false);
  const [autoAdapt, setAutoAdapt] = useState(true);
  
  // Speech synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Timers
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate total words in text
  const totalWords = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  /**
   * Start the reading session
   * - Initializes timers
   * - Begins tracking reading speed
   */
  const startReading = useCallback(() => {
    setIsReading(true);
    startTimeRef.current = Date.now();
    setSessionTime(0);
    setWordsRead(0);
    setCurrentWPM(0);
    
    // Update session time every second
    intervalRef.current = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  /**
   * Stop the reading session
   * - Clears all timers
   * - Preserves final statistics
   */
  const stopReading = useCallback(() => {
    setIsReading(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
  }, []);

  /**
   * Mark progress in reading
   * - Called when user scrolls or interacts with text
   * - Estimates words read based on scroll position
   */
  const updateProgress = useCallback((scrollPercent: number) => {
    if (!isReading) return;
    
    const estimatedWordsRead = Math.floor(totalWords * scrollPercent);
    setWordsRead(estimatedWordsRead);
    
    // Calculate WPM: words / (minutes elapsed)
    const minutesElapsed = (Date.now() - startTimeRef.current) / 60000;
    if (minutesElapsed > 0.05) { // Wait at least 3 seconds before calculating
      const wpm = Math.round(estimatedWordsRead / minutesElapsed);
      setCurrentWPM(wpm);
    }
  }, [isReading, totalWords]);

  /**
   * Adaptive logic: Adjust settings based on reading speed
   * - Runs every 5 seconds during reading
   * - Only applies changes if autoAdapt is enabled
   */
  useEffect(() => {
    if (!isReading || !autoAdapt) return;

    wpmIntervalRef.current = setInterval(() => {
      if (currentWPM > 0) {
        if (currentWPM < WPM_THRESHOLD_SLOW) {
          // Critical: Apply maximum assistance
          setSettings(CRITICAL_SETTINGS);
          setIsAdapted(true);
        } else if (currentWPM < WPM_THRESHOLD_GOOD) {
          // Slow: Apply moderate assistance
          setSettings(ADAPTED_SETTINGS);
          setIsAdapted(true);
        } else {
          // Good: Gradually return to defaults (optional gentle revert)
          // For now, maintain current settings to avoid jarring changes
        }
      }
    }, 5000);

    return () => {
      if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
    };
  }, [isReading, currentWPM, autoAdapt]);

  /**
   * Manual settings adjustment
   */
  const updateSettings = useCallback((newSettings: Partial<AdaptiveSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setIsAdapted(false);
  }, []);

  /**
   * Text-to-speech functionality
   * - Uses browser's built-in speech synthesis
   * - Respects user's system voice settings
   */
  const toggleSpeech = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for comprehension
      utterance.onend = () => setIsSpeaking(false);
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  }, [isSpeaking, text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  /**
   * Determine speed status for visual feedback
   */
  const getSpeedStatus = () => {
    if (currentWPM === 0) return "neutral";
    if (currentWPM >= WPM_THRESHOLD_GOOD) return "good";
    if (currentWPM >= WPM_THRESHOLD_SLOW) return "slow";
    return "critical";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        <Tabs defaultValue="reading" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="reading" className="gap-2 text-base">
              <BookOpen className="w-4 h-4" />
              Reading Mode
            </TabsTrigger>
            <TabsTrigger value="study" className="gap-2 text-base">
              <GraduationCap className="w-4 h-4" />
              Study Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reading" className="space-y-6">
            {/* Stats Panel */}
            <StatsPanel
              currentWPM={currentWPM}
              wordsRead={wordsRead}
              totalWords={totalWords}
              sessionTime={sessionTime}
              speedStatus={getSpeedStatus()}
              isReading={isReading}
            />

            {/* Reading Box */}
            <ReadingBox
              text={text}
              settings={settings}
              isAdapted={isAdapted}
              isReading={isReading}
              onStartReading={startReading}
              onStopReading={stopReading}
              onProgressUpdate={updateProgress}
              isSpeaking={isSpeaking}
              onToggleSpeech={toggleSpeech}
            />

            {/* Control Panel */}
            <ControlPanel
              settings={settings}
              onSettingsChange={updateSettings}
              onReset={resetSettings}
              autoAdapt={autoAdapt}
              onAutoAdaptChange={setAutoAdapt}
              onTextChange={setText}
              currentText={text}
            />
          </TabsContent>

          <TabsContent value="study">
            <StudyMode />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
