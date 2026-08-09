/*
 * File: components/BurgerMenu.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: A burger menu component.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 */

import React, { useState } from "react";
import "./BurgerMenu.css";

interface HamburgerMenuProps {
  colour?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ colour }) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  const handleCoverClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeMenu();
    }
  };

  return (
    <React.Fragment>
      <link
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      ></link>
      <div
        className={`nav-cover ${isMenuOpen ? "active" : ""}`}
        onClick={handleCoverClick}
      >
        <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <a href="/">Home</a>
          <a href="/engineering-team">Our Team</a>
          <a href="/contact-us">Contact us</a>
          <a href="/about-wesmo">About us</a>
          <a href="/about-fsae">About FSAE</a>
          <a href="/sponsors">Sponsors</a>
           {/*<a href="/race-data">Race Data</a>*/}
          <a href="/history">History</a>
        </div>
      </div>
      <div
        className={`hamburger-menu ${isMenuOpen ? "toggle" : ""} ${
          colour === "black" ? "black" : ""
        }`}
        onClick={toggleMenu}
      >
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>
    </React.Fragment>
  );
};

export default HamburgerMenu;
