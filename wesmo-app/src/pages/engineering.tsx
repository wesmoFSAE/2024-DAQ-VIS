import React from "react";
import BurgerMenu from "../components/BurgerMenu.tsx";
import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";
import { Link } from "react-router-dom";

import "../App.css";

const Engineering: React.FC = () => {
  return (
    <div className="App">
      <div className="background engineering" id="scroll">
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <BurgerMenu />
          </div>
        </div>
        <TitleCard title="Engineering Team" />
        <div id="team" style={{ textAlign: "center", padding: "2rem" }}>
          <p>
            Updated team profiles coming soon.
          </p>
          <p>
            In the meantime, check out our{" "}
            <Link to="/engineering-team/2024">2024 Engineering Team</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Engineering;