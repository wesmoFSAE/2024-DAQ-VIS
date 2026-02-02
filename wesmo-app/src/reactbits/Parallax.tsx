import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  fromY?: number; // px
  toY?: number;   // px
  className?: string;
};

const Parallax: React.FC<Props> = ({ children, fromY = 30, toY = -20, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: fromY, opacity: 0 },
        {
          y: toY,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [fromY, toY]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
};

export default Parallax;
