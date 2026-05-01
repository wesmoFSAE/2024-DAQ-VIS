/*
 * File: pages/engineering-team.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage which details the current engineering members of WESMO.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 *
 */

import React from "react";
import BurgerMenu from "../components/BurgerMenu.tsx";
import Logo from "../components/Logo.tsx";
import TeamMember from "../components/TeamMember.tsx";
import TitleCard from "../components/TitleCard.tsx";

import "../App.css";

// Importing all team member images
import Mark from "../images/team/Mark_hies.jpeg";
import Lianna from "../images/team/Lianna_greaves.jpeg";
import Blake from "../images/team/Blake_wilson.jpeg";
import Ellie from "../images/team/Ellie_mclaughlin.jpeg";
import Ethan from "../images/team/Ethan_matai'a.jpeg";
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
import logo from "../images/wesmo-logo/logo_header.png";

const Engineering: React.FC = () => {
  return (
    <div className="App">
      <link
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      ></link>
      <div className="background engineering" id="scroll">
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <BurgerMenu />
            <div className="nav-right"></div>
          </div>
        </div>
        <TitleCard title="2024 Engineering Team" />
        <div id="team">
          <TeamMember
            name1="Mark Hies"
            discipline1="Mechanical Engineering"
            component1="Drive train"
            name2="Lianna Greaves"
            discipline2="Mechanical Engineering"
            component2="Suspension"
            image1={Mark}
            image2={Lianna}
          ></TeamMember>
          <TeamMember
            name1="Lachlan Brown"
            discipline1="Mechanical Engineering"
            component1="Chassis"
            name2="Ellie McLaughlin"
            discipline2="Mechanical Engineering"
            component2="Chassis"
            image1={LachlanB}
            image2={Ellie}
          ></TeamMember>
          <TeamMember
            name1="Anthony East"
            discipline1="Mechanical Engineering"
            component1="Aerodynamics"
            name2="Keean Cooper"
            discipline2="Mechanical Engineering"
            component2="Aerodynamics"
            image1={Anthony}
            image2={Keean}
          ></TeamMember>
          <TeamMember
            name1="Allan Liang"
            discipline1="Mechanical Engineering"
            component1="Brakes"
            name2="Shane Thompson"
            discipline2="Mechanical Engineering"
            component2="Steering"
            image1={Allan}
            image2={Shane}
          ></TeamMember>
          <TeamMember
            name1="Blake Wilson"
            discipline1="Mechanical Engineering"
            component1="Pedal Box and Ergonomics"
            name2="Jackson Smith"
            discipline2="Mechanical Engineering"
            component2="Uprights"
            image1={Blake}
            image2={Jackson}
          ></TeamMember>
          <TeamMember
            name1="Cameron Mailer"
            discipline1="Mechanical Engineering"
            component1="Accumulator"
            name2="Hannah Murphy"
            discipline2="Software Engineering"
            component2="Data Aquisition and Visualisation"
            image1={Cameron}
            image2={Hannah}
          ></TeamMember>
          <TeamMember
            name1="Ethan Matai'a"
            discipline1="Mechatronics Engineering"
            component1="Safety systems"
            name2="George Armstrong"
            discipline2="Mechatronics Engineering"
            component2="Motor Controller"
            image1={Ethan}
            image2={George}
          ></TeamMember>
          <TeamMember
            name1="Lachlan Coleman"
            discipline1="Mechatronics Engineering"
            component1="Accumulator"
            name2="Trent Tuaupiki"
            discipline2="Mechatronics Engineering"
            component2="Electrical system design"
            image1={LachlanC}
            image2={Trent}
          ></TeamMember>
        </div>
      </div>
    </div>
  );
};

export default Engineering;
