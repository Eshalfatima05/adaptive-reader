import { useState, useEffect, useCallback, useRef } from "react";

interface FocusGuideProps {
  enabled: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const FocusGuide = ({ enabled, containerRef }: FocusGuideProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const guideRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !enabled) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    // Only show guide when mouse is within the container
    if (relativeY >= 0 && relativeY <= rect.height && e.clientX >= rect.left && e.clientX <= rect.right) {
      setPosition({
        top: relativeY,
        left: 0,
        width: rect.width,
      });
    }
  }, [containerRef, enabled]);

  useEffect(() => {
    if (!enabled) return;
    
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, handleMouseMove, containerRef]);

  if (!enabled || position.width === 0) return null;

  return (
    <div
      ref={guideRef}
      className="absolute pointer-events-none transition-all duration-75 ease-out z-10"
      style={{
        top: `${position.top - 12}px`,
        left: 0,
        width: "100%",
        height: "32px",
      }}
    >
      {/* Semi-transparent highlight bar */}
      <div className="w-full h-full bg-primary/10 rounded-lg border-l-4 border-primary/50" />
    </div>
  );
};