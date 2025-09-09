/*
 * File: pages/engineering.tsx
 * Description: WESMO Engineering Team page with clickable TiltedCards + popup descriptions.
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";
import TiltedCard from "../reactbits/TiltedCard.tsx";

import "../App.css";

// Team images
import Mark from "../images/team/Mark_hies.jpeg";
import Lianna from "../images/team/Lianna_greaves.jpeg";
import Blake from "../images/team/Blake_wilson.jpeg";
import Ellie from "../images/team/Ellie_mclaughlin.jpeg";
import Ethan from "../images/team/Ethan_matai'a.jpeg";        // ensure filename matches exactly
import George from "../images/team/George_armstrong.jpeg";
import Hannah from "../images/team/Hannah_murphy.jpeg";
import Jackson from "../images/team/Jackson_smith.jpeg";
import Keean from "../images/team/Keean_cooper.jpeg";
import LachlanB from "../images/team/Lachlan_brown.jpeg";
import LachlanC from "../images/team/Lachlan_coleman.jpeg";
import Shane from "../images/team/Shane_thompson.jpeg";
import Trent from "../images/team/Trent_tuapiki.jpeg";
import Cameron from "../images/team/cameron_mailer.jpeg";
import Allan from "../images/team/allan_liang.jpeg";
import Anthony from "../images/team/anthony_east.jpeg";

type Member = {
  name: string;
  discipline: string;
  component: string;
  img: string;
  description: string;
};

const MEMBERS: Member[] = [
  { name: "Mark Hies",        discipline: "Mechanical Engineering",    component: "Drive train",                       img: Mark,    description: "Led design and testing for the drive train; supported integration and reliability checks at events." },
  { name: "Lianna Greaves",   discipline: "Mechanical Engineering",    component: "Suspension",                        img: Lianna,  description: "Developed suspension geometry and tuning. Helped with setup sheets and trackside adjustments." },
  { name: "Lachlan Brown",    discipline: "Mechanical Engineering",    component: "Chassis",                           img: LachlanB,description: "Worked on chassis packaging and ergonomics; coordinated mounting points with subsystem leads." },
  { name: "Ellie McLaughlin", discipline: "Mechanical Engineering",    component: "Chassis",                           img: Ellie,   description: "Manufacturing lead for chassis components; oversaw quality checks and fit-up." },
  { name: "Anthony East",     discipline: "Mechanical Engineering",    component: "Aerodynamics",                      img: Anthony, description: "Designed aero surfaces and mounting, validated with CFD and track feedback." },
  { name: "Keean Cooper",     discipline: "Mechanical Engineering",    component: "Aerodynamics",                      img: Keean,   description: "Helped manufacture aero elements and ensured quick-change hardware for competition." },
  { name: "Allan Liang",      discipline: "Mechanical Engineering",    component: "Brakes",                            img: Allan,   description: "Owns braking system design, bias setup and pedal feel; ran dyno checks on components." },
  { name: "Shane Thompson",   discipline: "Mechanical Engineering",    component: "Steering",                          img: Shane,   description: "Steering rack and column design; focused on feedback and compliance reduction." },
  { name: "Blake Wilson",     discipline: "Mechanical Engineering",    component: "Pedal Box & Ergonomics",            img: Blake,   description: "Pedal box packaging & ergonomics; optimized driver fit and quick driver change procedures." },
  { name: "Jackson Smith",    discipline: "Mechanical Engineering",    component: "Uprights",                          img: Jackson, description: "Upright and hub design; weight reduction and stiffness trade-offs." },
  { name: "Cameron Mailer",   discipline: "Mechanical Engineering",    component: "Accumulator",                       img: Cameron, description: "Accumulator structure, interfacing, and safety mounting; coordinated cooling strategy." },
  { name: "Hannah Murphy",    discipline: "Software Engineering",      component: "Data Acquisition & Visualisation",  img: Hannah,  description: "Built the DAQ/visualisation stack and telemetry dashboard; integrated sensors with CAN nodes." },
  { name: "Ethan Matai'a",     discipline: "Mechatronics Engineering",  component: "Safety systems",                    img: Ethan,   description: "Safety interlocks and HV/LV monitoring; validated shutdown logic and IMD/AMS interfaces." },
  { name: "George Armstrong", discipline: "Mechatronics Engineering",  component: "Motor Controller",                  img: George,  description: "MC configuration & tuning; assisted with cooling and cabling layout." },
  { name: "Lachlan Coleman",  discipline: "Mechatronics Engineering",  component: "Accumulator",                       img: LachlanC,description: "Accumulator pack layout and BMS integration; documentation for scrutineering." },
  { name: "Trent Tuaupiki",   discipline: "Mechatronics Engineering",  component: "Electrical system design",          img: Trent,   description: "LV harness, power distribution and connector spec; focused on serviceability." },
];

/* ---------- Tiny Modal Component (portal) ---------- */
function MemberModal({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!member) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [member, onClose]);

  if (!member) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 92vw)",
          borderRadius: 16,
          background: "#1e1f22",
          color: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,.45)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "220px 1fr",
        }}
      >
        <img
          src={member.img}
          alt={member.name}
          style={{ width: 220, height: 220, objectFit: "cover" }}
        />
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0 }}>{member.name}</h2>
              <div style={{ opacity: 0.9, marginTop: 4 }}>{member.discipline}</div>
              <div style={{ opacity: 0.9 }}>{member.component}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 10,
                padding: "6px 10px",
                cursor: "pointer",
                height: 36,
                alignSelf: "start",
              }}
            >
              Close
            </button>
          </div>

          <p style={{ marginTop: 12, lineHeight: 1.6 }}>{member.description}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Page ---------- */
const Engineering: React.FC = () => {
  const [selected, setSelected] = useState<Member | null>(null);

  return (
    <div className="App">
      <link
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      />

      <div className="background engineering" id="scroll">
        {/* Top bar */}
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">{/* nav is handled elsewhere */}</div>
        </div>

        <TitleCard title="2024 Engineering Team" />

        {/* Team grid with clickable TiltedCards */}
        <div
          id="team"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "24px",
            padding: "24px",
          }}
        >
          {MEMBERS.map((m) => (
            <div
              key={m.name}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(m)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelected(m);
              }}
              style={{ cursor: "pointer" }}
              aria-label={`More about ${m.name}`}
            >
              <TiltedCard
                imageSrc={m.img}
                altText={m.name}
                captionText={m.name}
                containerHeight="280px"
                containerWidth="100%"
                imageHeight="280px"
                imageWidth="100%"
                rotateAmplitude={14}
                scaleOnHover={1.06}
                showMobileWarning={false}
                showTooltip={false}
                displayOverlayContent={true}
                overlayContent={
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "14px",
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
                      borderRadius: 16,
                      color: "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.1 }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: ".8rem", opacity: 0.95 }}>{m.discipline}</div>
                    <div style={{ fontSize: ".8rem", opacity: 0.9 }}>{m.component}</div>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Popup */}
      <MemberModal member={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Engineering;
