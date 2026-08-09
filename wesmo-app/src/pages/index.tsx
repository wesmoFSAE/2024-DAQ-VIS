/*
 * File: pages/index.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: The WESMO site home page
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 *
 */

import React from "react";
import Typewriter from "../components/TypeWriter.tsx";
import BurgerMenu from "../components/BurgerMenu.tsx";
import Logo from "../components/Logo.tsx";

import "../App.css";

const typeWriter = ["University", "Engineers", "Students"];

const Home: React.FC = () => {
  return (
    <div className="App">
      <link
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      ></link>
      <div className="background">
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <BurgerMenu />
            <div className="nav-right"></div>
          </div>
        </div>
        <div id="mainTitle">
          <div id="year">2026</div>
          <h1 className="text-3xl font-bold underline">
            Support Your Local
            <Typewriter data={typeWriter} />
            With WESMO
          </h1>
          <a href="/about-wesmo">
            <div href="#" id="subTitle">
              FIND OUT MORE
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
