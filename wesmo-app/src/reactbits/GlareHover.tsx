import React from "react";
import "./GlareHover.css";

type Props = {
  width?: string;           // e.g. "max-content" | "auto" | "240px"
  height?: string;          // e.g. "auto"
  background?: string;      // e.g. "transparent" or "#000"
  borderRadius?: string;    // e.g. "999px"
  borderColor?: string;     // e.g. "transparent"
  children: React.ReactNode;
  glareColor?: string;      // hex (#fff) or rgba()
  glareOpacity?: number;    // 0..1 (used only for hex input)
  glareAngle?: number;      // degrees
  glareSize?: number;       // percent (250 = 250%)
  transitionDuration?: number; // ms
  playOnce?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const GlareHover: React.FC<Props> = ({
  width = "500px",
  height = "500px",
  background = "#000",
  borderRadius = "10px",
  borderColor = "#333",
  children,
  glareColor = "#ffffff",
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 650,
  playOnce = false,
  className = "",
  style = {},
}) => {
  const hex = glareColor.replace("#", "");
  let rgba = glareColor;

  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const vars: React.CSSProperties = {
    // CSS vars consumed by the stylesheet
    ["--gh-width" as any]: width,
    ["--gh-height" as any]: height,
    ["--gh-bg" as any]: background,
    ["--gh-br" as any]: borderRadius,
    ["--gh-angle" as any]: `${glareAngle}deg`,
    ["--gh-duration" as any]: `${transitionDuration}ms`,
    ["--gh-size" as any]: `${glareSize}%`,
    ["--gh-rgba" as any]: rgba,
    ["--gh-border" as any]: borderColor,
  };

  return (
    <div
      className={`glare-hover ${playOnce ? "glare-hover--play-once" : ""} ${className}`}
      style={{ ...vars, ...style }}
    >
      {children}
    </div>
  );
};

export default GlareHover;
