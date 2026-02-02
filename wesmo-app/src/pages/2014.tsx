/*
 * File: pages/2014.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage describing the 2014 WESMO FSAE vehicle.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 *
 */

import React from "react";

import TitleCard from "../components/TitleCard.tsx";
import Logo from "../components/Logo.tsx";

import car_2014 from "../images/car_2014-2.jpg";

import "../App.css";

const History_2023: React.FC = () => {
  return (
    <div className="App">
      <div className="background history-table">
        <link
          href="https://fonts.googleapis.com/css?family=Roboto Condensed"
          rel="stylesheet"
        ></link>
        <div className="navbar">
          <div className="nav-left">
            <Logo colour="dark" />
          </div>
          <div className="nav-right">
         
            <div className="nav-right"></div>
          </div>
        </div>
        <br />
        <TitleCard title="W-FS14" />
        <br />
        <img src={car_2014} alt="W-FS14" className="history-car" />
        <table id="car_table" className="table table-bordered table-striped">
          <tbody>
            <tr>
              <th id="table_col">Engine</th>
              <td>Suzuki GSR600 - 60KW </td>
              <td>6 - Speed Sequential Gearbox</td>
            </tr>
            <tr>
              <th id="table_col">Drive Chain</th>
              <td>Drexler - LSD unit weight is approximately 2.6 kg </td>
              <td>Custom Sprocket and Carrier</td>
            </tr>
            <tr>
              <th id="table_col">Chassis</th>
              <td>Space-Frame Chassis</td>
              <td>Mild Steel</td>
            </tr>
            <tr>
              <th id="table_col">Suspension</th>
              <td>
                Unequal length, non-parallel wishbones. Pushrod actuated. With
                adj. Anti-Rollbar Front and Rear
              </td>
              <td>Ohlins Shock Absorbers</td>
            </tr>
            <tr>
              <th id="table_col">Braking System / Hub / Uprights</th>
              <td>
                Wilwood PS-1 Calipers with Twin outboard floating discs (Front)
                and Single inboard floating disc (Rear)
              </td>
              <td>Aluminium Uprights </td>
            </tr>
            <tr>
              <th id="table_col">Ergonomics</th>
              <td>
                3-D Printed Paddle Shifters / Motec Dash Display / Momo Steering
                Wheel
              </td>
              <td>3-D Printed Pedals / Custom Carbon Fibre Seat</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History_2023;
