/*
 * File: pages/sponsors.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage detailing the WESMO 2024 sponsors.
 */

import React from "react";
import { Link } from "react-router-dom";

import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";
import LogoLoop, { LogoItem } from "../reactbits/LogoLoop.tsx"; // ⬅️ use the loop

import proposal from "../files/Sponsorship_Proposal_2024.pdf";
import logo from "../images/wesmo-logo/logo_header.png";

// your existing sponsor data
import { bronze, silver, gold, platinum } from "../components/SponsorInfo.tsx";

import "../App.css";
import "./Sponsors.css"; // if you have styles here

// --- helper: normalize whatever SponsorInfo exports into LogoLoop items
type AnySponsor =
  | string
  | {
      src?: string;
      image?: string;
      img?: string;
      alt?: string;
      title?: string;
      href?: string;
      link?: string;
      url?: string;
    };

const toLogoItems = (items: AnySponsor[]): LogoItem[] =>
  items
    .map((it) => {
      if (typeof it === "string") return { src: it, alt: "" } as LogoItem;
      const src = it.src ?? it.image ?? it.img ?? "";
      const alt = it.alt ?? it.title ?? "";
      const href = it.href ?? it.link ?? it.url;
      return src ? ({ src, alt, href } as LogoItem) : null;
    })
    .filter((x): x is LogoItem => !!x);

const Sponsors: React.FC = () => {
  const platinumItems = toLogoItems(platinum as AnySponsor[]);
  const goldItems = toLogoItems(gold as AnySponsor[]);
  const silverItems = toLogoItems(silver as AnySponsor[]);
  const bronzeItems = toLogoItems(bronze as AnySponsor[]);

  return (
    <div className="App">
      <link
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      />
      <div className="background sponsors" id="scroll">
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <div className="nav-right" />
          </div>
        </div>

        <TitleCard title="Sponsors" />

        <div className="sponsors container">
          {/* Platinum */}
          <div className="title platinum">Platinum</div>
          <div className="loop-wrap">
            <LogoLoop
              logos={platinumItems}
              speed={140}
              direction="left"
              logoHeight={64}
              gap={56}
              pauseOnHover
              scaleOnHover
              fadeOut
              fadeOutColor="#0b0b0b"
              ariaLabel="Platinum sponsors"
            />
          </div>

          {/* Gold */}
          <div className="title gold">Gold</div>
          <div className="loop-wrap">
            <LogoLoop
              logos={goldItems}
              speed={120}
              direction="right"
              logoHeight={56}
              gap={48}
              pauseOnHover
              scaleOnHover
              fadeOut
              fadeOutColor="#0b0b0b"
              ariaLabel="Gold sponsors"
            />
          </div>

          {/* Silver */}
          <div className="title silver">Silver</div>
          <div className="loop-wrap">
            <LogoLoop
              logos={silverItems}
              speed={110}
              direction="left"
              logoHeight={48}
              gap={42}
              pauseOnHover
              scaleOnHover
              fadeOut
              fadeOutColor="#0b0b0b"
              ariaLabel="Silver sponsors"
            />
          </div>

          {/* Bronze */}
          <div className="title bronze">Bronze</div>
          <div className="loop-wrap">
            <LogoLoop
              logos={bronzeItems}
              speed={100}
              direction="right"
              logoHeight={44}
              gap={36}
              pauseOnHover
              scaleOnHover
              fadeOut
              fadeOutColor="#0b0b0b"
              ariaLabel="Bronze sponsors"
            />
          </div>

          {/* CTA block (unchanged) */}
          <div className="info">
            <div className="imagetext-component">
              <div className="image-container">
                <img src={logo} alt="WESMO" className="image" />
              </div>
              <div className="text-container">
                <p>
                  Want to sponsor us?
                  <br />
                  <br />
                  <Link
                    to={proposal}
                    target="_blank"
                    rel="noreferrer"
                    className="more"
                  >
                    Find out more
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* /sponsors */}
      </div>
    </div>
  );
};

export default Sponsors;
