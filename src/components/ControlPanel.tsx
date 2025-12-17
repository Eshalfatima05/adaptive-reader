import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, RotateCcw, Settings, FileText } from "lucide-react";

interface AdaptiveSettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
}

interface ControlPanelProps {
  settings: AdaptiveSettings;
  onSettingsChange: (settings: Partial<AdaptiveSettings>) => void;
  onReset: () => void;
  autoAdapt: boolean;
  onAutoAdaptChange: (value: boolean) => void;
  onTextChange: (text: string) => void;
  currentText: string;
}

export const ControlPanel = ({
  settings,
  onSettingsChange,
  onReset,
  autoAdapt,
  onAutoAdaptChange,
  onTextChange,
  currentText,
}: ControlPanelProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  const handleTextSubmit = () => {
    if (customText.trim()) {
      onTextChange(customText.trim());
      setCustomText("");
      setIsTextOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Manual Settings */}
      <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12"
            aria-expanded={isSettingsOpen}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Accessibility Settings
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isSettingsOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="bg-card rounded-xl p-6 shadow-soft space-y-6">
            {/* Auto Adapt Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-adapt" className="text-base font-medium">
                  Auto-Adapt
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically adjust text based on reading speed
                </p>
              </div>
              <Switch
                id="auto-adapt"
                checked={autoAdapt}
                onCheckedChange={onAutoAdaptChange}
              />
            </div>

            <hr className="border-border" />

            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Font Size</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.fontSize}px
                </span>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => onSettingsChange({ fontSize: value })}
                min={14}
                max={32}
                step={1}
                className="w-full"
                aria-label="Font size"
              />
            </div>

            {/* Line Height */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Line Spacing</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.lineHeight.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[settings.lineHeight]}
                onValueChange={([value]) => onSettingsChange({ lineHeight: value })}
                min={1.2}
                max={3}
                step={0.1}
                className="w-full"
                aria-label="Line spacing"
              />
            </div>

            {/* Letter Spacing */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Letter Spacing</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.letterSpacing.toFixed(2)}em
                </span>
              </div>
              <Slider
                value={[settings.letterSpacing]}
                onValueChange={([value]) =>
                  onSettingsChange({ letterSpacing: value })
                }
                min={0}
                max={0.2}
                step={0.01}
                className="w-full"
                aria-label="Letter spacing"
              />
            </div>

            {/* Word Spacing */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Word Spacing</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.wordSpacing.toFixed(2)}em
                </span>
              </div>
              <Slider
                value={[settings.wordSpacing]}
                onValueChange={([value]) =>
                  onSettingsChange({ wordSpacing: value })
                }
                min={0}
                max={0.3}
                step={0.01}
                className="w-full"
                aria-label="Word spacing"
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="secondary"
              onClick={onReset}
              className="w-full gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Custom Text Input */}
      <Collapsible open={isTextOpen} onOpenChange={setIsTextOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12"
            aria-expanded={isTextOpen}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Paste Custom Text
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isTextOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste or type your text here..."
              className="min-h-[150px] font-reading"
              aria-label="Custom text input"
            />
            <div className="flex gap-3">
              <Button onClick={handleTextSubmit} className="flex-1">
                Use This Text
              </Button>
              <Button
                variant="outline"
                onClick={() => setCustomText("")}
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
