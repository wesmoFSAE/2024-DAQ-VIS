/*
 * File: pages/2018.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage describing the 2018 WESMO FSAE vehicle.
 */

import React from "react";
import TitleCard from "../components/TitleCard.tsx";
import Logo from "../components/Logo.tsx";
import GradualBlur from "../reactbits/GradualBlur.tsx";

import car_2018 from "../images/backgrounds/wesmoBackGround.jpg";

import "../App.css";

const History_2018: React.FC = () => {
  const stats = [
    { label: "Power", value: "≈60 kW" },
    { label: "Drivetrain", value: "6-spd Seq." },
    { label: "Chassis", value: "Space-frame" },
    { label: "Mass", value: "—" },
  ];

  const quickSpecs = [
    {
      title: "Engine",
      items: ["2016 KTM 690 Duke-R (~60 kW)", "6-speed sequential gearbox"],
    },
    {
      title: "Drive Chain",
      items: ["Drexler LSD (~2.6 kg)", "Custom sprocket & carrier"],
    },
    {
      title: "Chassis",
      items: ["Space-frame", "1020 mild steel"],
    },
    {
      title: "Suspension",
      items: [
        "Double wishbone (F/R)",
        "Öhlins shocks",
        "3D-printed Ti inserts",
        "Carbon/Kevlar tubes",
      ],
    },
    {
      title: "Brakes / Hubs / Uprights",
      items: ["AP Racing calipers", "Custom discs", "Aluminium uprights"],
    },
    {
      title: "Ergonomics",
      items: [
        "Cable shifter / linked hydraulic clutch",
        "Custom steering wheel",
        "Custom seat",
        "Shift lever w/ clutch handle",
        "Driver display",
        "Carbon-fibre seat",
      ],
    },
    {
      title: "Body Kit",
      items: [
        "Nose cone / body shell / diffuser",
        "CF body kit & CF diffuser w/ Kevlar",
      ],
    },
  ];

  return (
    <div className="App">
      {/* Ensure the page can scroll: minHeight + overflowY */}
      <div
        className="background ws18-bg"
        style={{
          minHeight: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
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

        <TitleCard title="W-FS18" />

        {/* Hero */}
        <header
          className="ws18-hero"
          style={{
            backgroundImage: `url(${car_2018})`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="ws18-hero__veil" />
          <div className="ws18-hero__content">
            <h1>2018 Formula SAE Car</h1>
            <p>
              Internal combustion platform with space-frame chassis and
              track-proven hardware.
            </p>

            <div className="ws18-stats">
              {stats.map((s) => (
                <div key={s.label} className="ws18-stat">
                  <div className="ws18-stat__value">{s.value}</div>
                  <div className="ws18-stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Main content; add bottom padding so the fixed blur doesn't overlap */}
        <main className="ws18-main" style={{ paddingBottom: "12rem" }}>
          {/* Sticky rail (left) */}
          <aside className="ws18-rail">
            <h2 className="ws18-rail__title">Quick Specs</h2>
            <div className="ws18-rail__groups">
              {quickSpecs.map((group, i) => (
                <section
                  key={group.title}
                  className="ws18-rail__group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((it, k) => (
                      <li key={k}>{it}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </aside>

          {/* Content (right) */}
          <section className="ws18-content">
            <article className="ws18-card slide-in-up">
              <h3>Overview</h3>
              <p>
                W-FS18 pairs a reliable KTM single-cylinder powerplant with a
                light space-frame chassis. The car blends approachable
                maintenance with robust performance hardware—ideal for iterative
                testing and driver development.
              </p>
            </article>

            <article
              className="ws18-card slide-in-up"
              style={{ animationDelay: "80ms" }}
            >
              <h3>Engineering Highlights</h3>
              <ul className="ws18-bullets">
                <li>
                  3D-printed titanium inserts reinforce suspension loads while
                  reducing mass at the corners.
                </li>
                <li>
                  Carbon/Kevlar suspension tubes deliver stiffness with impact
                  resilience where it matters.
                </li>
                <li>
                  Öhlins dampers and adjustable geometry support quick setup
                  changes at events.
                </li>
                <li>
                  AP Racing brake package with custom discs for consistent pedal
                  feel and heat management.
                </li>
                <li>
                  Ergonomics refined for sprint events: clear driver display and
                  mechanical feedback.
                </li>
              </ul>
            </article>

            <article
              className="ws18-card slide-in-up"
              style={{ animationDelay: "160ms" }}
            >
              <h3>Body & Aero</h3>
              <p>
                The composite bodywork emphasises serviceability and durability.
                Carbon-fibre panels and diffuser parts are used where
                stiffness-to-weight ratios deliver the best return for track
                performance.
              </p>
            </article>
          </section>
        </main>
      </div>

      {/* Page-level blur: fixed at the bottom; doesn't block scroll */}
      <GradualBlur
        target="page"
        position="bottom"
        height="9rem"
        strength={2.2}
        divCount={7}
        curve="bezier"
        exponential
        opacity={1}
        zIndex={40}
      />
    </div>
  );
};

export default History_2018;
