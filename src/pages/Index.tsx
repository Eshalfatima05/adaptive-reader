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
 * READING SPEED THRESHOLDS (Words Per Minute)
 * 
 * These thresholds determine when text adaptations are applied:
 * 
 * - GOOD (120+ WPM): No adaptation needed - comfortable reading pace
 * - SLOW (80-120 WPM): Moderate adaptation - increase font/spacing slightly
 * - CRITICAL (<80 WPM): Full adaptation - maximum font size and spacing
 * 
 * Average adult reading speed: 200-250 WPM
 * Dyslexic readers often read at 100-150 WPM
 * Below 80 WPM suggests significant difficulty
 */
const WPM_THRESHOLD_GOOD = 120;
const WPM_THRESHOLD_SLOW = 80;

// Adaptive settings applied based on reading speed
interface AdaptiveSettings {
  fontSize: number;      // Base font size in pixels
  lineHeight: number;    // Line height multiplier  
  letterSpacing: number; // Letter spacing in em
  wordSpacing: number;   // Word spacing in em
}

// Default settings - comfortable for most readers
const DEFAULT_SETTINGS: AdaptiveSettings = {
  fontSize: 18,
  lineHeight: 1.6,
  letterSpacing: 0,
  wordSpacing: 0,
};

// Adapted settings - applied when WPM < 120
const ADAPTED_SETTINGS: AdaptiveSettings = {
  fontSize: 22,
  lineHeight: 2,
  letterSpacing: 0.05,
  wordSpacing: 0.1,
};

// Critical settings - applied when WPM < 80
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
  
  // Track cumulative reading data for accurate WPM
  const totalWordsReadRef = useRef(0);
  const totalTimeSpentRef = useRef(0);
  
  // Adaptive settings
  const [settings, setSettings] = useState<AdaptiveSettings>(DEFAULT_SETTINGS);
  const [isAdapted, setIsAdapted] = useState(false);
  const [autoAdapt, setAutoAdapt] = useState(true);
  
  // Speech synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Session timer
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate total words in text
  const totalWords = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  /**
   * Start the reading session
   */
  const startReading = useCallback(() => {
    setIsReading(true);
    startTimeRef.current = Date.now();
    setSessionTime(0);
    setWordsRead(0);
    setCurrentWPM(0);
    totalWordsReadRef.current = 0;
    totalTimeSpentRef.current = 0;
    
    // Reset to default settings at start
    setSettings(DEFAULT_SETTINGS);
    setIsAdapted(false);
    
    // Update session time every second
    intervalRef.current = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  /**
   * Stop the reading session
   */
  const stopReading = useCallback(() => {
    setIsReading(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  /**
   * Reset everything
   */
  const resetReading = useCallback(() => {
    setIsReading(false);
    setWordsRead(0);
    setCurrentWPM(0);
    setSessionTime(0);
    setSettings(DEFAULT_SETTINGS);
    setIsAdapted(false);
    totalWordsReadRef.current = 0;
    totalTimeSpentRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  /**
   * CORE WPM CALCULATION
   * 
   * Called when user finishes reading a paragraph.
   * 
   * WPM Formula: (Total Words Read) / (Total Time in Minutes)
   * 
   * Example:
   * - User reads 50 words in 30 seconds (0.5 minutes)
   * - WPM = 50 / 0.5 = 100 WPM
   * 
   * The running average is used to smooth out variations
   * between paragraphs of different difficulty.
   */
  const handleParagraphComplete = useCallback((wordsInParagraph: number, timeMs: number) => {
    // Update cumulative totals
    totalWordsReadRef.current += wordsInParagraph;
    totalTimeSpentRef.current += timeMs;
    
    // Update displayed words read
    setWordsRead(totalWordsReadRef.current);
    
    // Calculate WPM: words / minutes
    const totalMinutes = totalTimeSpentRef.current / 60000;
    if (totalMinutes > 0) {
      const wpm = Math.round(totalWordsReadRef.current / totalMinutes);
      setCurrentWPM(wpm);
      
      /**
       * ADAPTIVE TEXT ADJUSTMENT
       * 
       * Based on the calculated WPM, we adjust text presentation:
       * 
       * WPM >= 120: Good pace - no changes needed
       * WPM 80-119: Slow - moderate adaptation (larger font, more spacing)
       * WPM < 80: Critical - maximum adaptation for easiest reading
       */
      if (autoAdapt) {
        if (wpm < WPM_THRESHOLD_SLOW) {
          // Critical: User is struggling significantly
          console.log(`WPM ${wpm} < ${WPM_THRESHOLD_SLOW}: Applying CRITICAL settings`);
          setSettings(CRITICAL_SETTINGS);
          setIsAdapted(true);
        } else if (wpm < WPM_THRESHOLD_GOOD) {
          // Slow: User needs some assistance
          console.log(`WPM ${wpm} < ${WPM_THRESHOLD_GOOD}: Applying ADAPTED settings`);
          setSettings(ADAPTED_SETTINGS);
          setIsAdapted(true);
        }
        // If WPM >= 120, we don't revert to avoid jarring changes
      }
    }
  }, [autoAdapt]);

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
   */
  const toggleSpeech = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
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
              onParagraphComplete={handleParagraphComplete}
              onReset={resetReading}
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
