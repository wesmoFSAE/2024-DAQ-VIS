// Filename - pages/race-data.tsx
import React from "react";

import BurgerMenu from "../components/BurgerMenu.tsx";
import Logo from "../components/Logo.tsx";
import GridLayout from "../components/dashboard/GridLayout.tsx";
import NumberContainer from "../components/dashboard/NumberContainer.tsx";
import "../App.css";

const Data: React.FC = () => {
  return (
    <div className="App">
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
        <div className="dashboard">
          <div className="dashboard-row">
            <GridLayout size={2} bkg="#706B6B">
              <NumberContainer
                parameterOne={{ text: "Fuel", value: 50, unit: "%" }}
                lightText={true}
              />
            </GridLayout>
            <GridLayout size={2} bkg="#D9D9D9">
              <NumberContainer
                parameterOne={{ text: "Fuel", value: 50, unit: "%" }}
              />
            </GridLayout>
            <GridLayout size={2} bkg="#3B3B3B">
              <NumberContainer
                parameterOne={{ text: "Fuel", value: 50, unit: "%" }}
                lightText={true}
              />
            </GridLayout>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Data;
