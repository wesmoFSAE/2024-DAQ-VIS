/*
 * File: pages/history.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: WESMO “Through the Ages” — using Scroll Stack, but preserving
 *              the original images and color styling.
 */

import React from "react";
import { Link } from "react-router-dom";

import TitleCard from "../components/TitleCard.tsx";
import Logo from "../components/Logo.tsx";

// If your ScrollStack lives elsewhere, update the path:
import ScrollStack, { ScrollStackItem } from "../reactbits/ScrollStack.tsx";

import car_2023 from "../images/car_backend_cropped.jpg";
import car_2018 from "../images/backgrounds/wesmo_night.jpeg";
import car_2017 from "../images/2017_car.jpg";
import car_2016 from "../images/2016_car.jpg"; // kept for future use
import car_2015 from "../images/2015_car.jpg";
import car_2014 from "../images/2014_car.jpg";

import "../App.css";

const History: React.FC = () => {
  return (
    <div className="App">
      {/* keep the original background+palette classes */}
      <div className="background history history-stack-bg">
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

        <TitleCard title="WESMO Through the Ages" />

        {/* ScrollStack drives the stacking/scrolling; visuals stay as before */}
        <ScrollStack
          className="history-stack"
          itemDistance={1000}
          itemStackDistance={30}
          baseScale={0.85}
          itemScale={0.035}
          stackPosition="24%"
          scaleEndPosition="12%"
          rotationAmount={0}
          blurAmount={2}
          useWindowScroll={false}
        >
          {/* 2023 */}
          <ScrollStackItem itemClassName="history-card">
            <div>
              <div className="year-title">2023</div>
              <div className="subtitle">
                <div className="year">Internal Combustion Engine</div>
                <Link to="/history/2023" className="more">
                  <u className="more">Read More</u>
                </Link>
                
              </div>
              <img src={car_2023} alt="W-FS23" className="history-car" />
            </div>
          </ScrollStackItem>

          {/* 2018 */}
          <ScrollStackItem itemClassName="history-card">
            <div>
              <div className="year-title">2018</div>
              <div className="subtitle">
                <div className="year">Internal Combustion Engine</div>
                <Link to="/history/2018" className="more">
                  <u className="more">Read More</u>
                </Link>
                
              </div>
              <img src={car_2018} alt="W-FS18" className="history-car" />

            </div>

          </ScrollStackItem>

          {/* 2017 */}
          <ScrollStackItem itemClassName="history-card">
            <div>
              <div className="year-title">2017</div>
              <div className="subtitle">
                <div className="year">Internal Combustion Engine</div>
                <Link to="/history/2017" className="more">
                  <u className="more">Read More</u>
                </Link>
              </div>
              <img src={car_2017} alt="W-FS17" className="history-car" />
            </div>
          </ScrollStackItem>

          {/* 2015 */}
          <ScrollStackItem itemClassName="history-card">
            <div>
              <div className="year-title">2015</div>
              <div className="subtitle">
                <div className="year">Internal Combustion Engine</div>
                <Link to="/history/2015" className="more">
                  <u className="more">Read More</u>
                </Link>
              </div>
              <img src={car_2015} alt="W-FS15" className="history-car" />
            </div>
          </ScrollStackItem>

          {/* 2014 */}
          <ScrollStackItem itemClassName="history-card">
            <div>
              <div className="year-title">2014</div>
              <div className="subtitle">
                <div className="year">Internal Combustion Engine</div>
                <Link to="/history/2014" className="more">
                  <u className="more">Read More</u>
                </Link>
              </div>
              <img src={car_2014} alt="W-FS14" className="history-car" />
            </div>
          </ScrollStackItem>
        </ScrollStack>
      </div>
    </div>
  );
};

export default History;
