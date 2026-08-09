/*
 * File: pages/sponsors.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage detailing the WESMO 2024 sponsors.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 *
 */

import React from "react";
import { Link } from "react-router-dom";
import BurgerMenu from "../components/BurgerMenu.tsx";
import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";
import SponsorRow from "../components/Sponsors.tsx";

import proposal from "../files/Sponsorship_Proposal_2024.pdf";
import logo from "../images/wesmo-logo/logo_header.png";

import { bronze, silver, gold, platinum } from "../components/SponsorInfo.tsx";

import "../App.css";

const Sponsors: React.FC = () => {
  return (
    <div className="App">
      <link
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      ></link>
      <div className="background sponsors" id="scroll">
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <BurgerMenu />
            <div className="nav-right"></div>
          </div>
        </div>
        <TitleCard title="Sponsors"></TitleCard>
        <div className="sponsors">
          <div className="title platinum">Platinum</div>
          <SponsorRow images={platinum.slice(0, 5)} width={250} />
          <SponsorRow images={platinum.slice(5, 10)} width={250} />
          <SponsorRow images={platinum.slice(10, 15)} width={250} />
          <div className="title gold">Gold</div>
          <SponsorRow images={gold.slice(0, 3)} width={250} />
          <SponsorRow images={gold.slice(3, 7)} width={250} />
          <div className="title silver">Silver</div>
          <SponsorRow images={silver} width={150} />

          <div className="title bronze">Bronze</div>
          <SponsorRow images={bronze} width={120} />

          {/* <div className="info">
            <div className="imagetext-component">
              <div className="image-container">
                <img src={logo} alt="" className="image" />
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
          </div>*/}
        </div>
      </div>
    </div>
  );
};

export default Sponsors;
