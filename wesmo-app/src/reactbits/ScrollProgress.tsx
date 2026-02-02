import React, { useEffect, useRef } from "react";

type Props = { className?: string };

const ScrollProgress: React.FC<Props> = ({ className }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? scrollTop / docHeight : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      ref={barRef}
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 4,
        width: "100%",
        background: "rgba(255,255,255,0.9)",
        transformOrigin: "0 50%",
        transform: "scaleX(0)",
        zIndex: 50,
      }}
    />
  );
};

export default ScrollProgress;
