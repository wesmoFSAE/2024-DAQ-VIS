import React from "react";
import PillNav from "../reactbits/PillNav.tsx";
import wesmoHeaderLogo from "../images/wesmo-logo/logo_header.png";

const ITEMS = [
  { label: "Home",       href: "/" },
  { label: "Our Team",   href: "/engineering-team" },
  { label: "Contact us", href: "/contact-us" },
  { label: "About us",   href: "/about-wesmo" },
  { label: "About FSAE", href: "/about-fsae" },
  { label: "Sponsors",   href: "/sponsors" },
  { label: "Dashboard",  href: "/dashboard" },
  { label: "Race Data",  href: "/race-data" },
  { label: "History",    href: "/history" },
];

const AppHeader: React.FC = () => {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <PillNav
          logoSrc={wesmoHeaderLogo}
          items={ITEMS}
          baseColor="rgba(10,10,10,0.70)"
          pillColor="rgba(255,255,255,0.96)"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#0a0a0a"
        />
      </div>
    </header>
  );
};

export default AppHeader;
