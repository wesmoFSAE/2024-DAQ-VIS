import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./PillNav.css";

type NavItem = {
  label: string;
  href: string;         // can be "/route" or "#section"
  ariaLabel?: string;
};

type Props = {
  // Use ONE of these for the logo:
  logoSrc?: string;                 // e.g., import logo from "../images/logo.svg";
  logoNode?: React.ReactNode;       // e.g., <Logo />
  logoAlt?: string;

  items: NavItem[];
  activeHref?: string;              // optional external control; else we track current hash/path
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
};

const PillNav: React.FC<Props> = ({
  logoSrc,
  logoNode,
  logoAlt = "Logo",
  items,
  activeHref,
  className = "",
  ease = "power3.easeOut",
  baseColor = "#fff",
  pillColor = "#060010",
  hoveredPillTextColor = "#6c10ffff",
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true,
}) => {
  const resolvedPillTextColor = pillTextColor ?? baseColor;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localActiveHref, setLocalActiveHref] = useState<string>(() =>
    typeof window !== "undefined" ? (window.location.hash || window.location.pathname) : "/"
  );

  const circleRefs = useRef<HTMLSpanElement[]>([]);
  const tlRefs = useRef<gsap.core.Timeline[]>([]);
  const activeTweenRefs = useRef<gsap.core.Tween[]>([]);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | null>(null);

  // Keep active pill in sync with the URL hash / path unless externally controlled
  useEffect(() => {
    if (activeHref) return; // external control wins
    const onHashChange = () => setLocalActiveHref(window.location.hash || window.location.pathname);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [activeHref]);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;

        // geometry for arc circle
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        });

        const label = pill.querySelector<HTMLElement>(".pill-label");
        const white = pill.querySelector<HTMLElement>(".pill-label-hover");

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: "auto" }, 0);
        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();
    const onResize = () => layout();
    window.addEventListener("resize", onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: "hidden", opacity: 0, scaleY: 1 });
    }

    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItems = navItemsRef.current;

      if (logoEl) {
        gsap.set(logoEl, { scale: 0 });
        gsap.to(logoEl, { scale: 1, duration: 0.6, ease });
      }
      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: "hidden" });
        gsap.to(navItems, { width: "auto", duration: 0.6, ease });
      }
    }

    return () => window.removeEventListener("resize", onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: "auto" });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: "auto" });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, { rotate: 360, duration: 0.2, ease, overwrite: "auto" });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll<HTMLElement>(".hamburger-line");
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: "visible" });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease, transformOrigin: "top center" }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: "top center",
          onComplete: () => { gsap.set(menu, { visibility: "hidden" }); },
        });
      }
    }

    onMobileMenuClick?.();
  };

// Smooth scroll helper for "#hash" links
const scrollToHash = (hash: string) => {
  const id = hash.replace(/^#/, "");
  const el = document.getElementById(id);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "start" });

  // Update the URL hash without triggering the ESLint no-restricted-globals rule
  if (typeof window !== "undefined") {
    const newHash = `#${id}`;
    if (window.location.hash !== newHash) {
      if (window.history?.replaceState) {
        window.history.replaceState(null, "", newHash);
      } else {
        // fallback
        window.location.hash = newHash;
      }
    }
  }

  if (!activeHref) setLocalActiveHref(`#${id}`);
};

  const cssVars = {
    ["--base" as any]: baseColor,
    ["--pill-bg" as any]: pillColor,
    ["--hover-text" as any]: hoveredPillTextColor,
    ["--pill-text" as any]: resolvedPillTextColor,
  };

  const currentHref = activeHref ?? localActiveHref;

  return (
    <div className="pill-nav-container">
      <nav className={`pill-nav ${className || ""}`} aria-label="Primary" style={cssVars}>
        <a
          className="pill-logo"
          href={items?.[0]?.href || "/"}
          aria-label="Home"
          onMouseEnter={handleLogoEnter}
          ref={logoRef as any}
          onClick={(e) => {
            const h = items?.[0]?.href;
            if (h?.startsWith("#")) {
              e.preventDefault();
              scrollToHash(h);
            }
          }}
        >
          {logoNode ? (
            <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}>{logoNode}</span>
          ) : (
            <img src={logoSrc} alt={logoAlt} ref={logoImgRef} />
          )}
        </a>

        <div className="pill-nav-items desktop-only" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => {
              const isActive =
                // If the item is a hash link, compare to location.hash, else compare to pathname
                item.href.startsWith("#")
                  ? currentHref === item.href
                  : (currentHref || "").startsWith(item.href || "/");

              return (
                <li key={`${item.href}-${i}`} role="none">
                  <a
                    role="menuitem"
                    href={item.href}
                    className={`pill${isActive ? " is-active" : ""}`}
                    aria-label={item.ariaLabel || item.label}
                    onMouseEnter={() => handleEnter(i)}
                    onMouseLeave={() => handleLeave(i)}
                    onClick={(e) => {
                      if (item.href.startsWith("#")) {
                        e.preventDefault();
                        scrollToHash(item.href);
                      }
                    }}
                  >
                    <span
                      className="hover-circle"
                      aria-hidden="true"
                      ref={(el) => {
                        if (el) circleRefs.current[i] = el;
                      }}
                    />
                    <span className="label-stack">
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-label-hover" aria-hidden="true">
                        {item.label}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          className="mobile-menu-button mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        <ul className="mobile-menu-list">
          {items.map((item, i) => {
            const isActive =
              item.href.startsWith("#")
                ? currentHref === item.href
                : (currentHref || "").startsWith(item.href || "/");

            return (
              <li key={`m-${item.href}-${i}`}>
                <a
                  href={item.href}
                  className={`mobile-menu-link${isActive ? " is-active" : ""}`}
                  onClick={(e) => {
                    if (item.href.startsWith("#")) {
                      e.preventDefault();
                      scrollToHash(item.href);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
