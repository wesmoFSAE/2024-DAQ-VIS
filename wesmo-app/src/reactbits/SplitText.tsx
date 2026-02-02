import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

type Props = {
  text: string;
  delay?: number;       // ms
  duration?: number;    // seconds
  className?: string;
};

const SplitText: React.FC<Props> = ({ text, delay = 100, duration = 0.6, className }) => {
  const rootRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      const chars = rootRef.current!.querySelectorAll<HTMLSpanElement>(".rb-char");
      gsap.from(chars, {
        y: "0.8em",
        opacity: 0,
        duration,
        ease: "power3.out",
        delay: delay / 1000,
        stagger: 0.03,
      });
    }, rootRef);
    return () => ctx.revert();
  }, [text, delay, duration]);

  return (
    <span ref={rootRef} className={className} aria-label={text}>
      {text.split("").map((c, i) => (
        <span key={i} className="rb-char" style={{ display: "inline-block", willChange: "transform" }}>
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </span>
  );
};

export default SplitText;
