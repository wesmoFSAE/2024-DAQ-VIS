/*
 * File: App.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: The main file for the WESMO website, handle the sub-page routing.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 *
 * Usage: Compile this file using the TypeScript compiler to check type safety. Run entire App with 'npm start'.
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/index.tsx";
import Contact from "./pages/contact.tsx";
import About from "./pages/about.tsx";
import Sponsors from "./pages/sponsors.tsx";
import Engineering from "./pages/engineering.tsx";
import History2023 from "./pages/2023.tsx";
import History2018 from "./pages/2018.tsx";
import History2017 from "./pages/2017.tsx";
import History2015 from "./pages/2015.tsx";
import History2014 from "./pages/2014.tsx";
import History from "./pages/history.tsx";
import Data from "./pages/data.tsx";
import Fsae from "./pages/fsae.tsx";
import Explore from "./pages/explore.tsx";
import Engineering2024 from "./pages/engineering-2024.tsx"; 

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact-us" element={<Contact />} />
        <Route path="/about-wesmo" element={<About />} />
        <Route path="/about-fsae" element={<Fsae />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/engineering-team" element={<Engineering />} />
        <Route path="/race-data" element={<Data />} />
        <Route path="/history" element={<History />} />
        <Route path="/history-2023" element={<History2023 />} />
        <Route path="/history-2018" element={<History2018 />} />
        <Route path="/history-2017" element={<History2017 />} />
        {/* <Route path="/history-2016" element={<History2023 />} /> */}
        <Route path="/history-2015" element={<History2015 />} />
        <Route path="/history-2014" element={<History2014 />} />
        <Route path="/engineering-team/2024" element={<Engineering2024 />} />
        <Route path="/about-wesmo/explore" element={<Explore />} />
      </Routes>
    </Router>
  );
};

export default App;
