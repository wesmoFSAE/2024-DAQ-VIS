/*
 * File: pages/2015.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage describing the 2015 WESMO FSAE vehicle (same layout as 2018).
 */

import React from "react";

import TitleCard from "../components/TitleCard.tsx";
import Logo from "../components/Logo.tsx";
import GradualBlur from "../reactbits/GradualBlur.tsx";

import car_2015 from "../images/car_2015-2.jpg";

import "../App.css";

const History_2015: React.FC = () => {
  const stats = [
    { label: "Power", value: "≈60 kW" },
    { label: "Drivetrain", value: "6-spd Seq." },
    { label: "Chassis", value: "Space-frame" },
    { label: "Mass", value: "—" },
  ];

  const quickSpecs = [
    {
      title: "Engine",
      items: ["Suzuki GSR600", "≈60 kW peak output"],
    },
    {
      title: "Drive Chain",
      items: ["Drexler LSD (~2.6 kg)", "Custom sprocket & carrier"],
    },
    {
      title: "Chassis",
      items: ["Space-frame", "Mild steel"],
    },
    {
      title: "Suspension",
      items: [
        "Unequal-length wishbones (F/R)",
        "Pushrod actuated (Front & Rear)",
        "Öhlins shock absorbers",
      ],
    },
    {
      title: "Brakes / Hubs / Uprights",
      items: ["Wilwood PS-1 calipers", "Twin outboard floating discs (Front)", "Aluminium uprights"],
    },
    {
      title: "Ergonomics",
      items: [
        "3D-printed paddle shifters",
        "MoTeC dash / Momo steering wheel",
        "3D-printed pedals / carbon-fibre seat",
      ],
    },
    {
      title: "Body Kit",
      items: ["Nose cone / body shell / diffuser", "CF body kit & CF diffuser w/ Kevlar"],
    },
  ];

  return (
    <div className="App">
      <div className="background ws18-bg">
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

        {/* breadcrumb-style title like the rest of the site */}
        <TitleCard title="W-FS15" />

        {/* Hero (identical structure to 2018 page) */}
        <header
          className="ws18-hero"
          style={{
            backgroundImage: `url(${car_2015})`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="ws18-hero__veil" />
          <div className="ws18-hero__content">
            <h1>2015 Formula SAE Car</h1>
            <p>
              A lightweight, sprint-focused package built for repeatable performance and
              rapid iteration—powered by Suzuki’s GSR600 platform.
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

          {/* same gradual blur overlay at hero bottom */}
          <GradualBlur
            target="parent"
            position="bottom"
            height="8rem"
            strength={2.4}
            divCount={7}
            curve="bezier"
            exponential
            opacity={1}
            zIndex={2}
          />
        </header>

        {/* Main (identical grid to 2018 page) */}
        <main className="ws18-main">
          {/* Sticky rail with quick specs on the left */}
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

          {/* Content cards on the right */}
          <section className="ws18-content">
            <article className="ws18-card slide-in-up">
              <h3>Overview</h3>
              <p>
                W-FS15 prioritises reliability and sprint consistency. The combination of a
                space-frame chassis, straightforward serviceability, and proven hardware made it
                a dependable event car for iteration and driver development.
              </p>
            </article>

            <article className="ws18-card slide-in-up" style={{ animationDelay: "80ms" }}>
              <h3>Engineering Highlights</h3>
              <ul className="ws18-bullets">
                <li>Öhlins dampers with geometry tuned for quick setup changes.</li>
                <li>Drexler LSD providing predictable traction characteristics.</li>
                <li>AP/Wilwood braking package for consistent pedal feel and heat management.</li>
                <li>Driver-focused ergonomics with MoTeC dash and 3D-printed controls.</li>
              </ul>
            </article>

            <article className="ws18-card slide-in-up" style={{ animationDelay: "160ms" }}>
              <h3>Body &amp; Aero</h3>
              <p>
                Composite bodywork is optimised for serviceability and durability. Carbon-fibre
                panels and a reinforced diffuser are used where stiffness-to-weight returns best
                benefit overall track performance.
              </p>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
};

export default History_2015;
