import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Study Mode Component
 * - Allows users to paste text and get simplified notes
 * - Uses basic text simplification rules (no external API)
 * - Includes text-to-speech functionality
 */
export const StudyMode = () => {
  const [inputText, setInputText] = useState("");
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  /**
   * Simplify text using basic rules:
   * - Break long sentences
   * - Highlight key concepts
   * - Create bullet points
   * - Reduce complexity
   */
  const simplifyText = useCallback((text: string): string => {
    if (!text.trim()) return "";

    // Split into sentences
    const sentences = text
      .replace(/([.!?])\s+/g, "$1|")
      .split("|")
      .filter((s) => s.trim().length > 0);

    // Process each sentence
    const simplified = sentences.map((sentence) => {
      // Trim and ensure proper ending
      let s = sentence.trim();
      
      // If sentence is very long, try to break it
      if (s.length > 100) {
        // Break on common conjunctions
        s = s
          .replace(/, (and|but|or|so|yet|however|therefore|moreover) /gi, ".\n• $1 ")
          .replace(/ (which|that|who|where|when) /gi, ".\n• $1 ");
      }

      return s;
    });

    // Create summary with bullet points
    const bulletPoints = simplified
      .filter((s) => s.length > 20)
      .slice(0, 10)
      .map((s) => `• ${s}`);

    // Extract key terms (capitalized words that aren't at sentence start)
    const keyTerms: string[] = [];
    text.split(/\s+/).forEach((word) => {
      if (
        word.length > 4 &&
        word[0] === word[0].toUpperCase() &&
        word[0] !== word[0].toLowerCase()
      ) {
        const cleanWord = word.replace(/[^a-zA-Z]/g, "");
        if (cleanWord && !keyTerms.includes(cleanWord)) {
          keyTerms.push(cleanWord);
        }
      }
    });

    // Build output
    let output = "📝 SIMPLIFIED NOTES\n\n";
    output += "Key Points:\n";
    output += bulletPoints.join("\n");

    if (keyTerms.length > 0) {
      output += "\n\n🔑 Key Terms:\n";
      output += keyTerms.slice(0, 8).join(", ");
    }

    // Add word count comparison
    const originalWords = text.trim().split(/\s+/).length;
    const simplifiedWords = output.trim().split(/\s+/).length;
    output += `\n\n📊 Reduced from ${originalWords} to ${simplifiedWords} words`;

    return output;
  }, []);

  const handleSimplify = () => {
    if (!inputText.trim()) {
      toast({
        title: "No text entered",
        description: "Please paste some text to simplify.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing delay for UX
    setTimeout(() => {
      const result = simplifyText(inputText);
      setSimplifiedText(result);
      setIsProcessing(false);
      toast({
        title: "Text simplified!",
        description: "Your notes are ready.",
      });
    }, 500);
  };

  const handleCopy = async () => {
    if (!simplifiedText) return;
    
    await navigator.clipboard.writeText(simplifiedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Notes copied to clipboard.",
    });
  };

  const handleReadAloud = () => {
    if (!simplifiedText) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(simplifiedText);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Study Mode
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Paste any text and get simplified notes. Great for studying complex
          materials or summarizing long articles.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Original Text
          </label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your text here... (articles, textbook passages, study materials)"
            className="min-h-[300px] font-reading text-base"
          />
          <Button
            onClick={handleSimplify}
            disabled={isProcessing || !inputText.trim()}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isProcessing ? "Processing..." : "Simplify Text"}
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Simplified Notes
          </label>
          <div className="reading-container min-h-[300px]">
            {simplifiedText ? (
              <pre className="font-reading text-reading-text whitespace-pre-wrap text-base leading-relaxed">
                {simplifiedText}
              </pre>
            ) : (
              <p className="text-muted-foreground text-center py-20">
                Your simplified notes will appear here...
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!simplifiedText}
              className="flex-1 gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy Notes"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReadAloud}
              disabled={!simplifiedText}
              className="flex-1 gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Read Aloud
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
