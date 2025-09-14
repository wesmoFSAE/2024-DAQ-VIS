import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  CSSProperties,
} from "react";
import "./LogoLoop.css";

type NodeLogo = {
  node: React.ReactNode;
  title?: string;
  href?: string;
  ariaLabel?: string;
};

type ImageLogo = {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  href?: string;
};

export type LogoItem = NodeLogo | ImageLogo;

type Direction = "left" | "right";

type Props = {
  logos: LogoItem[];
  speed?: number;                 // px/s
  direction?: Direction;          // 'left' | 'right'
  width?: number | string;        // container width
  logoHeight?: number;            // px
  gap?: number;                   // px
  pauseOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2,
};

const toCssLength = (v?: number | string) =>
  typeof v === "number" ? `${v}px` : v ?? undefined;

const useResizeObserver = (
  callback: () => void,
  elements: React.RefObject<HTMLElement>[],
  deps: React.DependencyList
) => {
  useEffect(() => {
    if (!("ResizeObserver" in window)) {
      const onResize = () => callback();
      (window as Window).addEventListener("resize", onResize);
      callback();
      return () => (window as Window).removeEventListener("resize", onResize);
    }

    const obs = elements.map((ref) => {
      if (!ref.current) return null;
      const ro = new ResizeObserver(callback);
      ro.observe(ref.current);
      return ro;
    });

    callback();

    return () => {
      obs.forEach((o) => o?.disconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const useImageLoader = (
  seqRef: React.RefObject<HTMLUListElement>,
  onLoad: () => void,
  deps: React.DependencyList
) => {
  useEffect(() => {
    const imgs = seqRef.current?.querySelectorAll("img") ?? [];

    if (imgs.length === 0) {
      onLoad();
      return;
    }

    let remaining = imgs.length;
    const done = () => {
      remaining -= 1;
      if (remaining === 0) onLoad();
    };

    imgs.forEach((img) => {
      const el = img as HTMLImageElement;
      if (el.complete) done();
      else {
        el.addEventListener("load", done, { once: true });
        el.addEventListener("error", done, { once: true });
      }
    });

    return () => {
      imgs.forEach((img) => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const useAnimationLoop = (
  trackRef: React.RefObject<HTMLDivElement>,
  targetVelocity: number,
  seqWidth: number,
  isHovered: boolean,
  pauseOnHover: boolean
) => {
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    if (seqWidth > 0) {
      offsetRef.current = ((offsetRef.current % seqWidth) + seqWidth) % seqWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
    }

    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.max(0, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const target = pauseOnHover && isHovered ? 0 : targetVelocity;
      const ease = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * ease;

      if (seqWidth > 0) {
        let next = offsetRef.current + velocityRef.current * dt;
        next = ((next % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = next;
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [targetVelocity, seqWidth, isHovered, pauseOnHover, trackRef]);
};

const LogoLoop = memo(({
  logos,
  speed = 120,
  direction = "left",
  width = "100%",
  logoHeight = 28,
  gap = 32,
  pauseOnHover = true,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  ariaLabel = "Partner logos",
  className,
  style,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
  const [isHovered, setIsHovered] = useState(false);

  const targetVelocity = useMemo(() => {
    const mag = Math.abs(speed);
    const dirMul = direction === "left" ? 1 : -1;
    const sign = speed < 0 ? -1 : 1;
    return mag * dirMul * sign;
  }, [speed, direction]);

  const updateDims = useCallback(() => {
    const containerW = containerRef.current?.clientWidth ?? 0;
    const seqW = seqRef.current?.getBoundingClientRect?.().width ?? 0;
    if (seqW > 0) {
      setSeqWidth(Math.ceil(seqW));
      const copies = Math.ceil(containerW / seqW) + ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copies));
    }
  }, []);

  useResizeObserver(updateDims, [containerRef, seqRef], [logos, gap, logoHeight]);
  useImageLoader(seqRef, updateDims, [logos, gap, logoHeight]);
  useAnimationLoop(trackRef, targetVelocity, seqWidth, isHovered, pauseOnHover);

  const cssVars = useMemo(
    () => ({
      "--logoloop-gap": `${gap}px`,
      "--logoloop-logoHeight": `${logoHeight}px`,
      ...(fadeOutColor ? { "--logoloop-fadeColor": fadeOutColor } : {}),
    } as React.CSSProperties),
    [gap, logoHeight, fadeOutColor]
  );

  const rootClass = useMemo(
    () =>
      [
        "logoloop",
        fadeOut && "logoloop--fade",
        scaleOnHover && "logoloop--scale-hover",
        className,
      ]
        .filter(Boolean)
        .join(" "),
    [fadeOut, scaleOnHover, className]
  );

  const onEnter = useCallback(() => pauseOnHover && setIsHovered(true), [pauseOnHover]);
  const onLeave = useCallback(() => pauseOnHover && setIsHovered(false), [pauseOnHover]);

  const renderItem = useCallback((item: LogoItem, key: React.Key) => {
    const isNode = (item as NodeLogo).node !== undefined;

    const content = isNode ? (
      <span className="logoloop__node" aria-hidden={(item as NodeLogo).href ? true : false}>
        {(item as NodeLogo).node}
      </span>
    ) : (
      <img
        src={(item as ImageLogo).src}
        srcSet={(item as ImageLogo).srcSet}
        sizes={(item as ImageLogo).sizes}
        width={(item as ImageLogo).width}
        height={(item as ImageLogo).height}
        alt={(item as ImageLogo).alt ?? ""}
        title={item.title}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    );

    const label = isNode
      ? (item as NodeLogo).ariaLabel ?? (item as NodeLogo).title
      : (item as ImageLogo).alt ?? item.title;

    const wrapped = item.href ? (
      <a
        className="logoloop__link"
        href={item.href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={label || "logo link"}
      >
        {content}
      </a>
    ) : (
      content
    );

    return (
      <li className="logoloop__item" key={key} role="listitem">
        {wrapped}
      </li>
    );
  }, []);

  const lists = useMemo(
    () =>
      Array.from({ length: copyCount }, (_, i) => (
        <ul
          className="logoloop__list"
          key={`copy-${i}`}
          role="list"
          aria-hidden={i > 0}
          ref={i === 0 ? seqRef : undefined}
        >
          {logos.map((item, idx) => renderItem(item, `${i}-${idx}`))}
        </ul>
      )),
    [copyCount, logos, renderItem]
  );

  const containerStyle: CSSProperties = useMemo(
    () => ({
      width: toCssLength(width) ?? "100%",
      ...cssVars,
      ...style,
    }),
    [width, cssVars, style]
  );

  return (
    <div
      ref={containerRef}
      className={rootClass}
      style={containerStyle}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="logoloop__track" ref={trackRef}>{lists}</div>
    </div>
  );
});

LogoLoop.displayName = "LogoLoop";
export default LogoLoop;
