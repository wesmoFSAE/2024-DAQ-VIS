/*
 * File: pages/fsae.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage describing what FSAE is and the compeition WESMO attends in Australia.
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

import close_up from "../images/close_up.jpg";
import fsae from "../images/wesmo-logo/fsae-logo.png";
import rules from "../files/FSAE_Rules.pdf";

import "../App.css";

const Fsae: React.FC = () => {
  return (
    <div className="App">
      <link
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      ></link>
      <div className="background fsae" id="scroll">
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <BurgerMenu />
            <div className="nav-right"></div>
          </div>
        </div>
        <TitleCard title="Formula Society of Automotive Engineers" />
        <div className="right-display">
          <div className="image-text-component right fsae">
            <div className="text-container fsae-right">
              <p>
                Formula Society of Automotive Engineers, more commonly known as
                FSAE. Each year there is a competition where 30-35 teams compete
                against each other from across Oceania. Participants can hail
                from Australia, New Zealand, Japan, India, and Europe,
                representing a fraction of the over 600 teams worldwide. The
                competition puts the student-built race cars through varying
                events which are categorised as either “static” or “dynamic”.{" "}
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
              <img src={close_up} alt="" className="image fsae right" />
            </div>
          </div>
        </div>
        <div className="left-display">
          <div className="image-text-component left fsae">
            <div className="image-container fsae-left">
              <img src={fsae} alt="" className="image fsae logo" />
            </div>
            <div className="text-container fsae-left">
              <p>
                This years competition runs from the 7th to 10th December 2026 at
                The Bend Motorsport Park - Tailem Bend, South Australia.
                <br />
                <br />
                To find out more about SAEA: <br />
                <Link to="https://www.saea.com.au/" className="link fsae">
                  {" "}
                  https://www.saea.com.au/
                </Link>
              </p>
              <div className="pdf">
                <Link
                  to={rules}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                >
                  FSAE Rules 2026
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fsae;
