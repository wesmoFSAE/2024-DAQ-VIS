import React, { useEffect } from "react";
import { Link } from "react-router-dom";

import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";

import close_up from "../images/close_up.jpg";
import fsae from "../images/wesmo-logo/fsae-logo.png";
import rules from "../files/FSAE_Rules_2025_V1.pdf";

import "../App.css";

const Fsae: React.FC = () => {
  // Simple reveal-on-view for elements with .reveal
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("show");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div className="App">
      {/* (Small fix: proper Google Fonts URL) */}
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <div className="background fsae" id="scroll">
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <div className="nav-right"></div>
          </div>
        </div>

        <TitleCard title="Formula Society of Automotive Engineers" />

        {/* RIGHT PANEL — slides in from the right */}
        <div className="right-display">
          <div className="image-text-component right fsae reveal from-right">
            <div className="text-container fsae-right">
              <p>
                Formula Society of Automotive Engineers, more commonly known as
                FSAE. Each year there is a competition where 30-35 teams compete
                against each other from across Oceania. Participants can hail
                from Australia, New Zealand, Japan, India, and Europe,
                representing a fraction of the over 600 teams worldwide. The
                competition puts the student-built race cars through varying
                events which are categorised as either “static” or “dynamic”.
                <br />
                <br />
                The static events consist of design, cost, and a business pitch
                to investors. The dynamic events consist of skid pad,
                acceleration, autocross, efficiency, and endurance.
                <br />
                <br />
                In recent years, there has been a notable shift from internal
                combustion to electric vehicles among participating teams, with
                electric cars proving increasingly competitive.
              </p>
            </div>
            <div className="image-container fsae">
              <img
                src={close_up}
                alt="WESMO FSAE car close-up"
                className="image fsae right"
              />
            </div>
          </div>
        </div>

        {/* LEFT PANEL — slides in from the left */}
        <div className="left-display">
          <div className="image-text-component left fsae reveal from-left">
            <div className="image-container fsae-left">
              <img src={fsae} alt="SAE International logo" className="image fsae logo" />
            </div>
            <div className="text-container fsae-left">
              <p>
                This years competition runs from the 5th to 8th December 2024 at
                Calder Park Raceway, in Calder Park, Victoria, Australia.
                <br />
                <br />
                To find out more about SAEA:
                <br />
                <a
                  href="https://www.saea.com.au/"
                  target="_blank"
                  rel="noreferrer"
                  className="link fsae"
                >
                  https://www.saea.com.au/
                </a>
              </p>
              <div className="pdf">
                <a href={rules} target="_blank" rel="noreferrer" className="link">
                  FSAE Rules 2024
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal, scoped CSS for the slide-in motion */}
        <style>{`
          :root {
            --slide-dist: 8vw;     /* how far panels travel in */
            --slide-dur: 700ms;    /* animation duration */
          }

          .reveal {
            opacity: 0;
            transform: translateX(0);
            will-change: transform, opacity;
            transition:
              transform var(--slide-dur) cubic-bezier(.22,.61,.36,1),
              opacity   var(--slide-dur) ease;
          }
          .reveal.from-left  { transform: translateX(calc(var(--slide-dist) * -1)); }
          .reveal.from-right { transform: translateX(var(--slide-dist)); }
          .reveal.show { opacity: 1; transform: translateX(0); }

          /* if the reveal wrapper contains children with their own transitions, keep it simple */
          .reveal.show > * { transition: none; }

          /* accessibility: respect reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .reveal, .reveal.from-left, .reveal.from-right {
              opacity: 1 !important; transform: none !important; transition: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Fsae;