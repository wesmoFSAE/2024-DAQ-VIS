/*
 * File: pages/explore.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage for interactive exploration of a WESMO FSAE vehicle.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 *
 */

import React from "react";
import { Typography } from "@mui/material";

import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";
import InfoExplore from "../components/InfoExplore.tsx";

import PillNav from "../reactbits/PillNav.tsx";

import "../App.css";

const Explore: React.FC = () => {
  return (
    <div className="App">
      <div className="background background-scrollable ">
        <link
          href="https://fonts.googleapis.com/css?family=Roboto Condensed"
          rel="stylesheet"
        ></link>
        <div className="navbar nav-explore">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            
          </div>
        </div>
        <br />
        <div className="explore-body">
          <TitleCard title="Explore the W-SF18 & W-SF23" />
          <div className="helper">
            Scroll <i className="fa-solid fa-arrow-right"></i>
          </div>
          <div id="info-container">
            <InfoExplore
              x="58"
              y="12"
              contentHeader={{
                title: "Chassis",
                subheader: "Chassis specifications and information",
              }}
              contentBody={
                <>
                  <Typography variant="body2" color="white">
                    Space Frame steel tube chassis
                  </Typography>
                  <Typography variant="body2" color="white">
                    Length: 2350mm
                  </Typography>
                  <Typography variant="body2" color="white">
                    Width: 665mm
                  </Typography>
                  <Typography variant="body2" color="white">
                    Height: 1150mm
                  </Typography>
                  <Typography variant="body2" color="white">
                    2000 Nm/Deg torsional rigidity goal
                  </Typography>
                </>
              }
              contentExpanded={
                <>
                  <Typography variant="body2">
                    The overall size profile of the chassis was determined from
                    the performance of previous cars as one was designed as
                    narrow as possible for low mass but suffered from roll
                    stability and in slaloms, the next car was designed as wide
                    as track width would comfortably allow and it was found to
                    have slow transient movement through corners.
                  </Typography>
                  <Typography variant="body2">
                    The 2023 chassis was designed to be in the middle ground of
                    the 2 previous chassis in an attempt to find the optimal
                    size through iterations. The members and nodes are defined
                    by the suspension and driver profiles.
                  </Typography>
                  <Typography variant="body2">
                    To manufacture the chassis from the steel tubes they were
                    laser notched to match the CAD model and assembled in a MDF
                    jig to ensure each member is as close to the CAD model as
                    possible. The chassis was tig welded and checked against the
                    model for any warping and accuracy.
                  </Typography>
                </>
              }
            />
            <InfoExplore
              x="50"
              y="150"
              contentHeader={{
                title: "Steering",
                subheader: "Steering setup and information",
              }}
              contentBody={
                <>
                  <Typography variant="body2" color="white">
                    6 degrees Kingpin inclination
                  </Typography>
                  <Typography variant="body2" color="white">
                    6 degrees Caster Angle
                  </Typography>
                  <Typography variant="body2" color="white">
                    15mm scrub angle
                  </Typography>
                  <Typography variant="body2" color="white">
                    Shaft collars used for locking column and bearing mounts
                  </Typography>
                  <Typography variant="body2" color="white">
                    88% Ackerman
                  </Typography>
                  <Typography variant="body2" color="white">
                    5.2kg steering force per hand
                  </Typography>
                </>
              }
              contentExpanded={
                <>
                  <Typography variant="body2">
                    Calculations were undertaken using tyre data, These looked
                    at the amount of self aligning torque, and the lateral and
                    longitudinal traction coefficients seen at maximum expected
                    lateral Gs to find the maximum expected sland angle at
                    different speeds, The tie rod was designed to achieve the
                    minimum radius corner at 30kmh accounting for 4 degrees of
                    slip angle on the front and rear.
                  </Typography>
                  <Typography variant="body2">
                    Using Optimum Kinematics, a model of the 2023 car was
                    developed. This model then had simulations run on it, where
                    the amount of toe angle change was recorded with roll taking
                    place on the suspension.
                  </Typography>
                  <Typography variant="body2">
                    Bump stop brackets were added to space the closeouts from
                    the gear rack, while simultaneously preventing the steering
                    rack from cam over in steering rack failure. All parts had
                    FEA carried out on them, with designs being modified to
                    achieve a structurally sound steering system.
                  </Typography>
                </>
              }
            />
            <InfoExplore
              x="60"
              y="200"
              contentHeader={{
                title: "Ergonomics",
                subheader: "Ergonomics information",
              }}
              contentBody={
                <Typography variant="body2" color="white">
                  To fit the steering wheel in an ergonomic position, drivers
                  sat in the 2018 and 2022 cars, as well as in the WESMO
                  ergonmics jig, to find the preferred steering angle. This
                  being 25 degrees. The measurements using the previous vehicles
                  also ensure that drivers would not hit their legs whilst
                  operating the vehicle. To allow for adjustability for
                  different sized drivers a steering column with multiple key
                  slots was designed.
                </Typography>
              }
              contentExpanded={
                <>
                  <Typography variant="body2">
                    The headrest design for the 2023 car was made adjustable.
                    The reasoning behind this was to allow for a better suited
                    design for different sized drivers, while still remaing
                    within the FSAE rules. This also is beneficial for training
                    future drivers of all sizes.
                  </Typography>
                  <Typography variant="body2">
                    The pedal box design improves on that of the 2022 car with
                    respect to the the ease of adjustment. While the 2022
                    vehicles pedal box was adjustable, the force taken to move
                    the pedal box was high and the difficulty to adjust due to
                    alignment issues with the pegged holes made it often
                    unusable. The 2023 pedal box utilises slider rails, for easy
                    adjustibility. This design also makes use of heel rests for
                    driver comfort.
                  </Typography>
                </>
              }
            />
            <InfoExplore
              x="73"
              y="150"
              contentHeader={{
                title: "Drivetrain",
                subheader: "Drivetrain design and information",
              }}
              contentBody={
                <>
                  <Typography variant="body2" color="white">
                    The drivetrain is an assembly of serveral components that
                    work with eachother to transmit power and torque. Our unique
                    selling point is an eccentrically mounted differential,
                    taking complexity out of the chain tensioning. The main
                    parts include:
                  </Typography>
                  <Typography variant="body2">
                    Drexler FS Differential and support bearings
                  </Typography>
                  <Typography variant="body2">
                    An eccentric chain tensioning system integrated into the
                    main brackets
                  </Typography>
                  <Typography variant="body2">Tripod CV joints</Typography>
                  <Typography variant="body2">
                    Cross members for lateral rigidity
                  </Typography>
                </>
              }
              contentExpanded={
                <>
                  <Typography variant="body2">
                    Performance if any car is highly dependent on the final
                    drive ratio. Our research from 2019 has found the optimal
                    drive ratio for FSAE courses. This research mainly focused
                    on reducing acceleration times when compared to the 2018
                    team who used the same engine, the KTM Duke 690 R,
                  </Typography>
                  <Typography variant="body2">
                    The W-FS23's main drivetrain design concept was to have ease
                    of adjustability for the chain tension. An eccentric
                    mounting system was implemented into the main brackets,
                    where the differential and sprokets are mounted off centre
                    in the bearing mounts. The differential/sproket assembly can
                    be rotated about an axis to increase chain tension if need
                    be.
                  </Typography>
                  <Typography variant="body2">
                    This is an upgrade over previous WESMO chain tensioning
                    methods as it is more accessible to the user and requires
                    less bolts being undone. This means the operation is faster
                    and much more user friendly. The eccentric mounts are held
                    in place with clamping and friction, along with lockinh pins
                    as a failsafe.
                  </Typography>
                </>
              }
            />
            <InfoExplore
              x="40"
              y="200"
              contentHeader={{
                title: "Electrical & Wiring Loom",
                subheader:
                  "Engine Loom, ECU, Data Logger, Data Acquisition and Motor controller information",
              }}
              contentBody={
                <Typography variant="body2" color="white">
                  The engine loom distributes power to the sensors and
                  electronics. This includes: spark plugs, starter motor,
                  cooling fans, Motec, air, waterm oil pressure, and more. The
                  output from the sensors go into the ECU. The start button,
                  ignition switch, and E-stop all connect behind the dash.
                </Typography>
              }
              contentExpanded={
                <>
                  <Typography variant="body2">
                    The ECU in the 2023 car is the Link G4+ Monsoon. This ECU
                    takes a large variety of inputs including 4 digital, 4
                    analogue, 2 trigger inputs, 2 temperature inputs, and 1
                    onboard 4 bar MAP sensor.
                  </Typography>
                  <Typography variant="body2">
                    The data logger is used to record all of the sensor data
                    from the acquisition loom. This data is then read and used
                    to adjust certain parts of the car, see how each driver
                    performs and motor vehicle stats. It is integrated into the
                    vehicle dashbaord.
                  </Typography>
                  <Typography variant="body2">
                    Our data acquisition loom includes 4 shock sensors, 2 break
                    position sensors, gearbox sensor, 4 wheel speed sensors, a
                    GPS sensor and a steering position sensor.
                  </Typography>
                </>
              }
            />
            <InfoExplore
              x="48"
              y="70"
              contentHeader={{
                title: "Suspension",
                subheader: "Optimisation, Joint Strength, and specifications",
              }}
              contentBody={
                <>
                  <Typography variant="body2" color="white">
                    Weight optimised titanium wishbones adapters
                  </Typography>
                  <Typography variant="body2" color="white">
                    4-way adjustable pneumatic shocks
                  </Typography>
                  <Typography variant="body2" color="white">
                    "Upside Down" rear upper wishbone pushrod mount
                  </Typography>
                  <Typography variant="body2" color="white">
                    Shock position sensors on all corners
                  </Typography>
                </>
              }
              contentExpanded={
                <>
                  <Typography variant="body2">
                    The wishbones are as wide as possible while clearing the
                    rims in all conditions. Reducing scrub radis and wider rim
                    with equal radius compare to previous cars means the 2023
                    cars wishbones are about half the width.
                  </Typography>
                  <Typography variant="body2">
                    The use of aluminimum, titanium and carbon fibre composites
                    in select areas further our optimisation. Key examples are
                    the use of stell for the interior rod end plugs to get
                    requisite thread strength in tension, aluminimum used on the
                    outer where such fine details are not requried. Titanium
                    used for the wishbone adapters to save unsprung weight and
                    allow for complex geometry.
                  </Typography>
                  <Typography variant="body2">
                    Carbon fibre has proven difficult to bond to metals strongly
                    enough. Some of our previous cars has issues with adhesives
                    failing. Dowel pins proved an effective but suboptimal and
                    labour intensive solution.
                  </Typography>
                </>
              }
            />
            <InfoExplore
              x="20"
              y="200"
              contentHeader={{
                title: "Aerodynamics",
                subheader: "Philosophy, Marketing and more",
              }}
              contentBody={
                <Typography variant="body2" color="white">
                  The 2023 teams time was at a premium. Development time on aero
                  subsequently was a low priority. A strong focus was put onto
                  vehicle dynamics, steering, suspension and drivetrain.
                  Spending time of these areas with a focus on designing for
                  reliablitiy allowed the team to make the most of the little
                  testing time avaliable.
                </Typography>
              }
              contentExpanded={
                <>
                  <Typography variant="body2">
                    The nose cone is manufactured from carbon fibre laid in a
                    fibreglass mold negative (itself formed from a machined foam
                    plug) negative, giving a professional finish.
                  </Typography>
                  <Typography variant="body2">
                    Closeout panels are required by the rules to seperate the
                    driver from the track. A noisecone can meet this requirement
                    and also reduce drag.
                  </Typography>
                  <Typography variant="body2">
                    WESMO usees an undertray due to its 3 key benefits:
                  </Typography>
                  <Typography variant="body2">
                    1. Downforce. At 80kmh the undertray produces approximately
                    300N of downforce. This downforce acts about the centreline
                    of the car and counters the cars natural rollover tendencies
                    associated with its relatively narrow wheelbase.
                  </Typography>
                  <Typography variant="body2">
                    2.Centre of gravity. Becuase the undertray is located very
                    low on the car, despite adding weight it is a net benefit to
                    the cars cornering ability as it lowers the cars centre of
                    gravity slightly, again reducing the cars rollover
                    tendencies.
                  </Typography>
                  <Typography variant="body2">
                    3. Marketing the appearance of a car is important, the
                    addition of an undertray will improve marketability of the
                    car for sponsors and the university.
                  </Typography>
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
