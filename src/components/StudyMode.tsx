import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, Volume2, Upload, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const StudyMode = () => {
  const [inputText, setInputText] = useState("");
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSimplify = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No text entered",
        description: "Please paste some text or upload a PDF to simplify.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setSimplifiedText("");

    try {
      const { data, error } = await supabase.functions.invoke("summarize-text", {
        body: { text: inputText },
      });

      if (error) throw error;

      if (data?.summary) {
        setSimplifiedText(data.summary);
        toast({ title: "Text simplified!", description: "Your AI-powered notes are ready." });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error simplifying text:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to simplify text.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    setIsPdfLoading(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      setInputText(fullText.trim());
      toast({ title: "PDF loaded!", description: `Extracted text from ${pdf.numPages} page(s).` });
    } catch (error) {
      console.error("Error reading PDF:", error);
      toast({ title: "Error", description: "Failed to read PDF.", variant: "destructive" });
    } finally {
      setIsPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCopy = async () => {
    if (!simplifiedText) return;
    await navigator.clipboard.writeText(simplifiedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Notes copied to clipboard." });
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
        <h2 className="text-2xl font-semibold text-foreground mb-2">Study Mode</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Paste any text or upload a PDF and get AI-powered simplified notes.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">Your Text</label>
          <div>
            <input type="file" accept=".pdf" onChange={handlePdfUpload} ref={fileInputRef} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPdfLoading} className="gap-2">
              {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isPdfLoading ? "Loading..." : "Upload PDF"}
            </Button>
          </div>
        </div>
        
        <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your text here, or upload a PDF..." className="min-h-[200px] font-reading text-base" />
        
        <Button onClick={handleSimplify} disabled={isProcessing || !inputText.trim()} className="w-full gap-2" size="lg">
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isProcessing ? "AI is processing..." : "Simplify with AI"}
        </Button>
      </div>

      {(simplifiedText || isProcessing) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <label className="block text-sm font-medium text-foreground">AI-Generated Notes</label>
          </div>
          
          <div className="reading-container min-h-[200px]">
            {isProcessing ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Generating notes...</span>
              </div>
            ) : (
              <pre className="font-reading text-reading-text whitespace-pre-wrap text-base leading-relaxed">{simplifiedText}</pre>
            )}
          </div>
          
          {simplifiedText && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCopy} className="flex-1 gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Notes"}
              </Button>
              <Button variant="outline" onClick={handleReadAloud} className="flex-1 gap-2">
                <Volume2 className="w-4 h-4" />
                Read Aloud
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
