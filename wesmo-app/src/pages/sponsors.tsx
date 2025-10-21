/*
 * File: pages/sponsors.tsx
 * Author: Hannah Murphy (updated)
 * Description: WESMO sponsors page with full-bleed tier bands and smooth logo loops.
 */

import React from "react";
import { Link } from "react-router-dom";

import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";
import LogoLoop, { LogoItem } from "../reactbits/LogoLoop.tsx";

import proposal from "../files/Sponsorship_Proposal_2025.pdf";
import logo from "../images/wesmo-logo/logo_header.png";

// Sponsor data (arrays of image paths/objects)
import { bronze, silver, gold, platinum } from "../components/SponsorInfo.tsx";

import "../App.css";
import "./Sponsors.css";

// ---- helper: normalize SponsorInfo exports into LogoLoop items ----
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
      <link href="https://fonts.googleapis.com/css?family=Roboto Condensed" rel="stylesheet" />
      <div className="background sponsors" id="scroll">
        {/* Nav (site-wide component styles) */}
        <div className="navbar">
          <div className="nav-left"><Logo /></div>
          <div className="nav-right"><div className="nav-right" /></div>
        </div>

        <TitleCard title="Sponsors" />

        {/* ========= PLATINUM (full-bleed) ========= */}
        <section className="tier-row platinum">
          <div className="tier-inner">
            <div className="title">Platinum</div>
            <div className="loop-wrap">
              <LogoLoop
                logos={platinumItems}
                speed={140}
                direction="left"
                logoHeight={64}
                gap={56}
                pauseOnHover
                scaleOnHover
                      // remove dark edge fade
              />
            </div>
          </div>
        </section>

        {/* ========= GOLD ========= */}
        <section className="tier-row gold">
          <div className="tier-inner">
            <div className="title">Gold</div>
            <div className="loop-wrap">
              <LogoLoop
                logos={goldItems}
                speed={120}
                direction="right"
                logoHeight={56}
                gap={48}
                pauseOnHover
                scaleOnHover
                fadeOut={false}
              />
            </div>
          </div>
        </section>

        {/* ========= SILVER ========= */}
        <section className="tier-row silver">
          <div className="tier-inner">
            <div className="title">Silver</div>
            <div className="loop-wrap">
              <LogoLoop
                logos={silverItems}
                speed={110}
                direction="left"
                logoHeight={48}
                gap={42}
                pauseOnHover
                scaleOnHover
                fadeOut={false}
              />
            </div>
          </div>
        </section>

        {/* ========= BRONZE ========= */}
        <section className="tier-row bronze">
          <div className="tier-inner">
            <div className="title">Bronze</div>
            <div className="loop-wrap">
              <LogoLoop
                logos={bronzeItems}
                speed={100}
                direction="right"
                logoHeight={44}
                gap={36}
                pauseOnHover
                scaleOnHover
                fadeOut={false}
              />
            </div>
          </div>
        </section>

        {/* CTA block */}
        <div className="info">
          <div className="imagetext-component">
            <div className="image-container">
              <img src={logo} alt="WESMO" className="image" />
            </div>
            <div className="text-container">
              <p>
                Want to sponsor us?
                <br /><br />
                <Link to={proposal} target="_blank" rel="noreferrer" className="more">
                  Find out more
                </Link>
              </p>
            </div>
          </div>
        </div>
        {/* /sponsors */}
      </div>
    </div>
  );
};

export default Sponsors;
