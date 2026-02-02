import React from "react";
import { Outlet } from "react-router-dom";   // must be named import
import AppHeader from "./AppHeader.tsx";         // must be default import

const AppLayout: React.FC = () => {
  return (
    <>
      <AppHeader />
      <div className="page-wrap">
        <Outlet />
      </div>
    </>
  );
};

export default AppLayout;
