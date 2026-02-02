/*
 * File: pages/2017.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage describing the 2017 WESMO FSAE vehicle.
 */

import React from "react";
import TitleCard from "../components/TitleCard.tsx";
import Logo from "../components/Logo.tsx";

import car_2017 from "../images/car_2017-2.jpg";

import "../App.css";

const History_2017: React.FC = () => {
  const chips = [
    { label: "Engine", value: "Suzuki GSR600 • ~60 kW" },
    { label: "Drivetrain", value: "6-speed sequential" },
    { label: "Chassis", value: "Space-frame (mild steel)" },
  ];

  const steps: Array<{
    title: string;
    left?: string[];
    right?: string[];
  }> = [
    {
      title: "Engine",
      left: ["Suzuki GSR600", "~60 kW peak"],
      right: ["Sequential shifting", "Track-proven reliability"],
    },
    {
      title: "Drive Chain",
      left: ["Drexler LSD (~2.6 kg)", "Custom sprocket / carrier"],
      right: ["Optimised final drive", "Low compliance under load"],
    },
    {
      title: "Chassis",
      left: ["Space-frame chassis", "Mild steel construction"],
      right: ["Serviceable joints", "Torsional stiffness tuned for sprint"],
    },
    {
      title: "Suspension",
      left: ["Front: direct double wishbone", "Rear: bell-crank actuation"],
      right: ["Öhlins dampers", "Event-ready, quick setup"],
    },
    {
      title: "Braking / Hubs / Uprights",
      left: ["Wilwood PS1 calipers", "Custom discs"],
      right: ["CNC-machined aluminium uprights", "Consistent pedal feel"],
    },
    {
      title: "Ergonomics",
      left: ["3D-printed paddle shifters", "MoTeC dash / Momo wheel"],
      right: ["3D-printed pedals", "Custom carbon-fibre seat"],
    },
  ];

  return (
    <div className="App">
      <div className="background ws17-bg">
        <link
          href="https://fonts.googleapis.com/css?family=Roboto Condensed"
          rel="stylesheet"
        />
        <div className="navbar">
          <div className="nav-left">
            <Logo colour="dark" />
          </div>
          <div className="nav-right">
            <div className="nav-right" />
          </div>
        </div>

        <TitleCard title="W-FS17" />

        {/* HERO */}
        <header className="ws17-hero">
          <div
            className="ws17-hero__img"
            style={{ backgroundImage: `url(${car_2017})` }}
            aria-hidden
          />
          <div className="ws17-hero__content">
            <h1>2017 Formula SAE Car</h1>
            <p>
              A lightweight, serviceable space-frame package with a robust
              powertrain and sprint-focused setup.
            </p>

            <div className="ws17-chips">
              {chips.map((c) => (
                <div key={c.label} className="ws17-chip">
                  <div className="ws17-chip__label">{c.label}</div>
                  <div className="ws17-chip__value">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* TIMELINE */}
        <main className="ws17-main">
          <section className="ws17-timeline">
            <div className="ws17-timeline__line" aria-hidden />
            {steps.map((s, i) => {
              const leftSide = i % 2 === 0; // alternate sides
              return (
                <article
                  key={s.title}
                  className={`ws17-step ${leftSide ? "left" : "right"}`}
                  style={{ ["--d" as any]: `${i * 70}ms` }} // per-step delay
                >
                  <div className="ws17-step__dot" />
                  <div className="ws17-card">
                    <h3>{s.title}</h3>
                    <div className="ws17-card__cols">
                      {s.left && (
                        <ul className="ws17-list">
                          {s.left.map((li, k) => (
                            <li key={k}>{li}</li>
                          ))}
                        </ul>
                      )}
                      {s.right && (
                        <ul className="ws17-list">
                          {s.right.map((li, k) => (
                            <li key={k}>{li}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
};

export default History_2017;
