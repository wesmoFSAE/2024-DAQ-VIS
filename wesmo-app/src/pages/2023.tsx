/*
 * File: pages/2023.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage describing the 2023 WESMO FSAE vehicle.
 */

import React from "react";

import TitleCard from "../components/TitleCard.tsx";
import Logo from "../components/Logo.tsx";
import StudentDetails from "../components/StudentDetails.tsx";
import SlideIn from "../components/SlideIn.tsx"; // <-- added

import Car_Backend from "../images/backgrounds/car_backend.jpg";
import Team1 from "../images/2023_team.jpg";
import Team2 from "../images/2023_team2.jpg";

import "../App.css";

const History_2023: React.FC = () => {
  return (
    <div className="App">
      <div className="background history-2023">
        <link
          href="https://fonts.googleapis.com/css?family=Roboto Condensed"
          rel="stylesheet"
        />
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <div className="nav-right"></div>
          </div>
        </div>

        <br />
        <TitleCard title="2023 Team" />
        <br />

        {/* 1) LEFT -> slide in */}
        <SlideIn from="left">
          <div className="image-text-component left">
            <div className="image-container left">
              <img src={Car_Backend} alt="" className="image left" />
            </div>
            <div className="text-container left">
              <p>
                In the face of towering challenges, our small but mighty team at
                WESMO stood resilient, overcoming every obstacle with unwavering
                unity and determination. From setbacks to late nights, we
                transformed adversity into fuel for our collective fire. Today, as
                the competition concludes, we're not just a team; we're a family
                bound by passion, grit, and an unbreakable spirit. Our journey
                wasn't just about building a car; it was about forging unshakable
                bonds and leaving an indelible mark of perseverance and unity.
                <br />
                <br />
                We managed to get second place in the Skid pan and Autocross
                events under the internal combustion category and unfortunately
                did not get to finish the endurance event in the second half but
                we are very happy about what we were able to achieve under many
                challenges. We've learned a lot this year and hope to come back
                stronger next year. Special thanks to all our sponsors and
                supervisors who made this achievement possible. - WESMO 2023
              </p>
            </div>
          </div>
        </SlideIn>

        <div style={{ height: "80px" }} />

        {/* 2) RIGHT -> slide in */}
        <SlideIn from="right">
          <div className="image-text-component right">
            <div className="text-container right">
              <StudentDetails
                name="Brandon Fletcher"
                discipline="Mechanical Engineering"
                component="Vehicle system and geometry optimisation"
              />
              <StudentDetails
                name="James Voss"
                discipline="Mechanical Engineering"
                component="Vehicle suspension"
              />
              <StudentDetails
                name="Daniel Crowther"
                discipline="Mechanical Engineering"
                component="Engine and differential mounting"
              />
              <StudentDetails
                name="Ricko Agluba"
                discipline="Mechanical Engineering"
                component="Air intake system and engine tuning"
              />
              <StudentDetails
                name="Aidan Berger"
                discipline="Mechanical Engineering"
                component="Uprights and wheel hubs"
              />
              <StudentDetails
                name="Wilson Au"
                discipline="Electrical Engineering"
                component="Electrical grounding research"
              />
              <StudentDetails
                name="Sithika Fernando"
                discipline="Mechatronics Engineering"
                component="Energy storage system for EV"
              />
            </div>
            <div className="image-container right">
              <img src={Team1} alt="" className="image right" />
            </div>
          </div>
        </SlideIn>

        <div style={{ height: "80px" }} />

        {/* 3) LEFT -> slide in */}
        <SlideIn from="left">
          <div className="image-text-component left">
            <div className="image-container left">
              <img src={Team2} alt="" className="image left" />
            </div>
            <div className="text-container left">
              <StudentDetails
                name="Thomas Morcom"
                discipline="Software Engineering"
                component="Performance monitoring system, electric feedback, and driver feedback"
              />
              <StudentDetails
                name="Casper Tyson"
                discipline="Software Engineering"
                component="ECU and software performance optimisation"
              />
              <StudentDetails
                name="Chris Skelly"
                discipline="Electrical Engineering"
                component="Battery and safety systems"
              />
              <StudentDetails
                name="Thomas Morcom"
                discipline="Software Engineering"
                component="Performance monitoring system, electric feedback, and driver feedback"
              />
              <StudentDetails
                name="Jedd Lupoy"
                discipline="Software Engineering"
                component="Accumulator unit digital twin development"
              />
              <StudentDetails
                name="Vinod Rodrigo"
                discipline="Mechatronics Engineering"
                component="Fully functioning drivetrain design and build"
              />
            </div>
          </div>
        </SlideIn>

        <div style={{ height: "70px" }} />
      </div>
    </div>
  );
};

export default History_2023;
