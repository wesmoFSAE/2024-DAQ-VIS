// src/components/SlideIn.tsx
import React, { useEffect, useRef, useState } from "react";

type SlideInProps = {
  from?: "left" | "right";
  threshold?: number;
  distance?: number;
  durationMs?: number;
  children: React.ReactNode;
  className?: string;
};

const SlideIn: React.FC<SlideInProps> = ({
  from = "left",
  threshold = 0.2,
  distance = 40,
  durationMs = 500,
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // SSR / no-window / no-IntersectionObserver -> just show it
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const initialX = from === "left" ? -distance : distance;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: visible ? "translateX(0)" : `translateX(${initialX}px)`,
        opacity: visible ? 1 : 0,
        transition: `transform ${durationMs}ms cubic-bezier(.2,.8,.2,1), opacity ${durationMs}ms ease`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};

export default SlideIn;
