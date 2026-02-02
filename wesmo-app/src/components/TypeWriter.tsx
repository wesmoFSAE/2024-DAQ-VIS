import React, { useEffect, useState } from "react";

type TypeWriterProps = {
  data: string[];          // words to cycle through
  typingSpeed?: number;    // ms per character while typing
  deletingSpeed?: number;  // ms per character while deleting
  pauseBetween?: number;   // ms to pause on a full word before deleting
  loop?: boolean;
  className?: string;
};

const TypeWriter: React.FC<TypeWriterProps> = ({
  data,
  typingSpeed = 60,
  deletingSpeed = 30,
  pauseBetween = 1000,
  loop = true,
  className,
}) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const words = data && data.length ? data : [""];
    const current = words[wordIndex % words.length];

    let timer: number;

    if (!isDeleting) {
      if (display.length < current.length) {
        timer = window.setTimeout(
          () => setDisplay(current.slice(0, display.length + 1)),
          typingSpeed
        );
      } else {
        timer = window.setTimeout(() => setIsDeleting(true), pauseBetween);
      }
    } else {
      if (display.length > 0) {
        timer = window.setTimeout(
          () => setDisplay(current.slice(0, display.length - 1)),
          deletingSpeed
        );
      } else {
        setIsDeleting(false);
        const next = wordIndex + 1;
        if (next >= words.length && !loop) return;
        setWordIndex(next % words.length);
      }
    }

    return () => clearTimeout(timer);
  }, [data, wordIndex, display, isDeleting, typingSpeed, deletingSpeed, pauseBetween, loop]);

  return (
    <span className={className} aria-live="polite">
      {display}
      <span style={{ display: "inline-block", width: "0.6ch", animation: "blink 1s steps(1) infinite" }}>|</span>
    </span>
  );
};

export default TypeWriter;
