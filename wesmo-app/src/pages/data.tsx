/*
 * File: pages/data.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage which connnects to the WESMO digital dashboard for driving analytics.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 *
 */

import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "../App.css";


import Logo from "../components/Logo.tsx";
import DefaultGrid from "../components/dashboard/DefaultGrid.tsx";
import Spinner from "../components/dashboard/Spinner.tsx";
import InfoIcon from "../components/dashboard/InfoIcon.tsx";
import PopUp from "../components/dashboard/PopUpContainer.tsx";

export interface DataItem {
  name: string;
  value: number | string;
  min: number | string;
  max: number | string;
  unit: string;
}

const defaultTimer: DataItem[] = [
  {
    name: "Track Time",
    value: "00:00:00",
    min: "",
    max: "",
    unit: "",
  },
];

const Data: React.FC = () => {
  const [data, setData] = useState<DataItem[] | undefined>(undefined);
  const [timer, setTimer] = useState<DataItem[]>(defaultTimer);
  const [loaded, setLoaded] = useState(false);
  const [noDataReceived, setNoDataReceived] = useState(false);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<number>(
    Date.now()
  );

  useEffect(() => {
    const connect = () => {
      setLoaded(true);
      setNoDataReceived(true);
      setLastDataTimestamp(Date.now());
      console.log(`Connected with id: ${socket.id}`);
    };

    const disconnect = () => {
      console.log(`Disconnected with id: ${socket.id}`);
    };

    const handleNewData = (receivedData: DataItem[] | undefined) => {
      if (data !== receivedData) {
        setData(receivedData);
        setLastDataTimestamp(Date.now());
        setNoDataReceived(false);
        socket.emit("timer");
      }
    };

    const timerRecieve = (timer: DataItem[]) => {
      setTimer(timer);
    };
    const socket = io("https://wesmo.co.nz/", {
      transports: ["websocket"],
    });

    socket.on("connect", connect);
    socket.on("disconnect", disconnect);
    socket.on("data", handleNewData);
    socket.on("timerRecieve", timerRecieve);

    return () => {
      socket.off("connect", connect);
      socket.off("disconnect", disconnect);
      socket.off("data", handleNewData);
      socket.off("timerRecieve", timerRecieve);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastDataTimestamp > 15000) {
        console.log("Error 503: Lost connection to server");
        setNoDataReceived(true);
        setData(undefined);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [lastDataTimestamp]);

  const [isPopUpVisible, setPopUpVisible] = useState<boolean>(false);
  const [popUpContent, setPopUpContent] = useState<React.ReactNode>(null);

  const togglePopUp = (content?: React.ReactNode) => {
    setPopUpContent(content ?? null);
    setPopUpVisible((prev) => !prev);
  };

  if (!loaded) {
    return (
      <div className="App">
        <div className="background data load">
          <div className="navbar">
            <div className="nav-left">
              <Logo colour="dark" />
            </div>
            <div className="nav-right">
             
              <div className="nav-right"></div>
            </div>
          </div>
          <div className="loading">
            <h2>Waiting for connection...</h2>
          </div>
          <Spinner />
        </div>
      </div>
    );
  } else if (!data) {
    return (
      <div className="App">
        <div className="background data load">
          <div className="navbar">
            <div className="nav-left">
              <Logo colour="dark" />
            </div>
            <div className="nav-right">
             
              <div className="nav-right"></div>
            </div>
          </div>
          <div className="no-data">
            <h2>W-FS24 isn't racing</h2>
            <br />
            <h4>Come back soon</h4>
          </div>
        </div>
      </div>
    );
  } else if (!loaded && noDataReceived) {
    return (
      <div className="App">
        <div className="background data load">
          <div className="navbar">
            <div className="nav-left">
              <Logo colour="dark" />
            </div>
            <div className="nav-right">
             
              <div className="nav-right"></div>
            </div>
          </div>
          <div className="no-data">
            <h2>Lost connection to W-FS24</h2>
            <br />
            <h4>Service Unavalible</h4>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="App">
        <div className="background data">
          <div className="navbar">
            <div className="nav-left nav-dashboard">
              <Logo colour="dark" />
            </div>
            <div
              onClick={() =>
                togglePopUp(
                  <div className="info-popup">
                    <h4>WESMO Race Dashboard</h4>
                    <div>
                      The 2024 EV is able to communicate data live as it runs.
                      Our team uses this dashboard to monitor the car systems
                      while it's out on the track.
                    </div>
                    <table style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Colours</th>
                          <th></th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ height: "1rem" }}>
                          <td>
                            <span
                              className="dot"
                              style={{ backgroundColor: "#3274b1" }}
                            ></span>
                          </td>
                          <td>Values in blue are just normal data points.</td>
                          <td>
                            1. Clicking on a data widget allows you to see its
                            recent history.
                          </td>
                        </tr>
                        <tr style={{ height: "1rem" }}>
                          <td>
                            <span
                              className="dot"
                              style={{ backgroundColor: "#4da14b" }}
                            ></span>
                          </td>
                          <td>
                            Green is good, the value is in the expected range.
                          </td>
                          <td>
                            2. The system status on the left shows the current
                            status of our car. If the systems are on, heres
                            where youll see.
                          </td>
                        </tr>
                        <tr style={{ height: "1rem" }}>
                          <td>
                            <span
                              className="dot"
                              style={{ backgroundColor: "#eac054" }}
                            ></span>
                          </td>
                          <td>
                            Warnings will be yellow, this is data our team needs
                            to watch.
                          </td>
                          <td>
                            3. In the bottom left are any errors picked up in
                            our vehiclesa system.
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span
                              className="dot"
                              style={{ backgroundColor: "#af1713" }}
                            ></span>
                          </td>
                          <td>
                            Red means issues and its time to get the driver to
                            pull over.
                          </td>
                          <td>
                            4. At the top right by the menu is general
                            information about the dashbaord and an indicator if
                            our software has any issues.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              }
            >
              <InfoIcon />
            </div>
            <PopUp
              isVisible={isPopUpVisible}
              onClose={() => setPopUpVisible(false)}
            >
              {popUpContent}
            </PopUp>
            <div className="nav-right">
             
              <div className="nav-right"></div>
            </div>
          </div>
          <DefaultGrid data={data} timer={timer} />
        </div>
      </div>
    );
  }
};

export default Data;
