// src/reactbits/MagicBento.tsx
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';

/* -----------------------------
   Constants & Types
-------------------------------- */
const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255'; // "r,g,b" (no alpha)
const MOBILE_BREAKPOINT = 768;

export type BentoItem = {
  color?: string;
  title: string;
  description: string;
  label?: string;
  href?: string; // optional link to open on click
};

const defaultCardData: BentoItem[] = [
  { color: '#060010', title: 'Analytics',     description: 'Track user behavior',          label: 'Insights' },
  { color: '#060010', title: 'Dashboard',     description: 'Centralized data view',        label: 'Overview' },
  { color: '#060010', title: 'Collaboration', description: 'Work together seamlessly',     label: 'Teamwork' },
  { color: '#060010', title: 'Automation',    description: 'Streamline workflows',         label: 'Efficiency' },
  { color: '#060010', title: 'Integration',   description: 'Connect favorite tools',       label: 'Connectivity' },
  { color: '#060010', title: 'Security',      description: 'Enterprise-grade protection',  label: 'Protection' }
];

/* -----------------------------
   Small utilities
-------------------------------- */
const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number
) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

/* -----------------------------
   Mobile detection hook
-------------------------------- */
function useMobileDetection(): boolean {
  const getIsMobile = () =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false;

  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile);

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}

/* -----------------------------
   Inline GlobalSpotlight
-------------------------------- */
const GlobalSpotlight: React.FC<{
  gridRef: React.RefObject<HTMLDivElement>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string; // "r,g,b"
}> = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || disableAnimations || !gridRef.current) return;

    // create spotlight element
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      z-index: 200;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      const grid = gridRef.current!;
      const section = grid.closest('.bento-section') as HTMLElement | null;
      const rect = section?.getBoundingClientRect();
      const inside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      const cards = grid.querySelectorAll<HTMLElement>('.card');

      if (!inside) {
        gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        cards.forEach(c => c.style.setProperty('--glow-intensity', '0'));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const distance =
          Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(r.width, r.height) / 2;
        const eff = Math.max(0, distance);
        minDistance = Math.min(minDistance, eff);

        let glow = 0;
        if (eff <= proximity) glow = 1;
        else if (eff <= fadeDistance) glow = (fadeDistance - eff) / (fadeDistance - proximity);

        updateCardGlowProperties(card, e.clientX, e.clientY, glow, spotlightRadius);
      });

      gsap.to(spotlight, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
          ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
          : 0;

      gsap.to(spotlight, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out'
      });
    };

    const handleLeave = () => {
      const grid = gridRef.current!;
      grid.querySelectorAll<HTMLElement>('.card').forEach(c => {
        c.style.setProperty('--glow-intensity', '0');
      });
      gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: 'power2.out' });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleLeave);
      spotlight.remove();
      spotlightRef.current = null;
    };
  }, [enabled, disableAnimations, glowColor, gridRef, spotlightRadius]);

  return null;
};

/* -----------------------------
   Bento grid & minimal ParticleCard
-------------------------------- */
const BentoCardGrid: React.FC<{
  children: React.ReactNode;
  gridRef: React.RefObject<HTMLDivElement>;
}> = ({ children, gridRef }) => (
  <div className="card-grid bento-section" ref={gridRef}>
    {children}
  </div>
);

type ParticleCardProps = React.HTMLAttributes<HTMLDivElement> & {
  disableAnimations?: boolean;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
};

const ParticleCard = React.forwardRef<HTMLDivElement, ParticleCardProps>(
  ({ children, className = '', style, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`${className} particle-container`}
        style={{ position: 'relative', overflow: 'hidden', ...(style || {}) }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
ParticleCard.displayName = 'ParticleCard';

/* -----------------------------
   MagicBento component
-------------------------------- */
const MagicBento: React.FC<{
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string; // "r,g,b"
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  items?: BentoItem[];
}> = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
  items
}) => {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  const data = items && items.length ? items : defaultCardData;

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        {data.map((card, index) => {
          const baseClassName =
            `card ${textAutoHide ? 'card--text-autohide' : ''} ${enableBorderGlow ? 'card--border-glow' : ''}`;

          // style with custom CSS var
          const cardStyle: React.CSSProperties & Record<string, string | number> = {
            backgroundColor: card.color || '#060010',
          };
          cardStyle['--glow-color'] = glowColor;

          const body = (
            <>
              <div className="card__header">
                {card.label && <div className="card__label">{card.label}</div>}
              </div>
              <div className="card__content">
                <h2 className="card__title">{card.title}</h2>
                <p className="card__description">{card.description}</p>
              </div>
            </>
          );

          const CardWrap: any = enableStars ? ParticleCard : 'div';

          return (
            <CardWrap
              key={index}
              className={baseClassName}
              style={{ ...cardStyle, cursor: card.href ? 'pointer' as const : 'default' }}
              disableAnimations={shouldDisableAnimations}
              particleCount={particleCount}
              glowColor={glowColor}
              enableTilt={enableTilt}
              clickEffect={clickEffect}
              enableMagnetism={enableMagnetism}
              onClick={() => {
                if (card.href) window.location.href = card.href;
              }}
              role={card.href ? 'link' : undefined}
              aria-label={card.href ? `Open ${card.title}` : undefined}
            >
              {body}
            </CardWrap>
          );
        })}
      </BentoCardGrid>
    </>
  );
};

export default MagicBento;
