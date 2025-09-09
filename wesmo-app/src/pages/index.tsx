import React, { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GlareHover from "../reactbits/GlareHover.tsx";
import TypeWriter from "../components/TypeWriter.tsx";

import Logo from "../components/Logo.tsx";// at the top with your other imports
import wesmoHeaderLogo from "../images/wesmo-logo/logo_header.png";
import PillNav from "../reactbits/PillNav.tsx";

import "../App.css";

gsap.registerPlugin(ScrollTrigger);


/* --- Inline “React Bits” primitives (no imports = no mismatch) --- */
function RBScrollProgress({ className = "" }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? st / h : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
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
      aria-hidden
    />
  );
}

function RBReveal({
  children,
  className = "",
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none reverse",
            once,
          },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [once]);
  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

function RBParallax({
  children,
  fromY = 24,
  toY = 0,
  className = "",
}: {
  children: React.ReactNode;
  fromY?: number;
  toY?: number;
  className?: string;
}) {
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
          duration: 0.6,
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
}

function RBSplitText({
  text,
  delay = 100,
  duration = 0.6,
  className = "",
}: {
  text: string;
  delay?: number; // ms
  duration?: number; // s
  className?: string;
}) {
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
}
/* --- end inline bits --- */

const words = ["University", "Engineers", "Students"];

const Home: React.FC = () => {
  return (
    <div className="App" style={{ position: "relative", minHeight: "100vh", color: "#fff" }}>
      <RBScrollProgress />

      {/* Background image + overlay (keeps your existing .background) */}
      <div className="background" style={{ position: "absolute", inset: 0, zIndex: -2 }} aria-hidden />
      <div style={{ position: "absolute", inset: 0, zIndex: -1 }} aria-hidden />

      {/* <header className="absolute inset-x-0 top-0 z-40"> 
      <div className="mx-auto max-w-7xl px-6 py-5"> */}

      {/* Centered Pill Nav (positioning handled in PillNav.css) */}
      {/* <PillNav
        logoSrc={wesmoHeaderLogo}
        items={[
          { label: "Home", href: "/" },
          { label: "Our Team", href: "/engineering-team" },
          { label: "Contact us", href: "/contact-us" },
          { label: "About us", href: "/about-wesmo" },
          { label: "About FSAE", href: "/about-fsae" },
          { label: "Sponsors", href: "/sponsors" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Race Data", href: "/race-data" },
          { label: "History", href: "/history" },
        ]}
        baseColor="rgba(10,10,10,0.70)"
        pillColor="rgba(255,255,255,0.96)"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#0a0a0a"
      />
      </div>
    </header>  */}


      {/* Hero */}
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <section style={{ width: "100%", maxWidth: 1120, padding: "0 24px" }}>
          {/* Year pill */}
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(4px)",
              marginBottom: 16,
              fontSize: 12,
              letterSpacing: 1.2,
            }}
          >
            2025
          </div>

          {/* Headline */}
          <div style={{ lineHeight: 1.05, fontWeight: 700, fontFamily: "'Roboto Condensed', sans-serif" }}>
            <RBReveal>
              <h1 style={{ fontSize: "clamp(40px, 6vw, 72px)", margin: 0 }}>
                <RBSplitText text="Support Your Local" delay={80} duration={0.6} />
              </h1>
            </RBReveal>

            <RBReveal>
              <div style={{ fontSize: "clamp(20px, 2.8vw, 28px)", marginTop: 8, opacity: 0.9 }}>
                <TypeWriter data={words} />
              </div>
            </RBReveal>

            <RBReveal>
              <h2 style={{ fontSize: "clamp(40px, 6vw, 72px)", margin: "8px 0 0 0", fontWeight: 700 }}>
                <RBSplitText text="With WESMO" delay={120} duration={0.6} />
              </h2>
            </RBReveal>
          </div>

          {/* CTA with GlareHover */}
          <RBParallax fromY={24} toY={0}>
            <GlareHover
              width="max-content"
              height="auto"
              background="transparent"
              borderRadius="999px"
              borderColor="transparent"
              glareColor="#ff0000ff"
              glareOpacity={0.35}
              glareAngle={-30}
              glareSize={220}
              transitionDuration={800}
            >
              <a
                href="/about-wesmo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "#fff",
                  color: "#000000ff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                FIND OUT MORE
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </GlareHover>
          </RBParallax>
        </section>
      </main>
    </div>
  );
};

export default Home;
