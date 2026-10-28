/*
 * File: pages/contact.tsx
 * Author: Hannah Murphy
 * Date: 2024
 * Description: Webpage describing how to get in touch with the WESMO club.
 *
 * Copyright (c) 2024 WESMO. All rights reserved.
 * This code is part of the  WESMO Data Acquisition and Visualisation Project.
 *
 */

import React from "react";
import { Link } from "react-router-dom";
import BurgerMenu from "../components/BurgerMenu.tsx";
import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";
import "../App.css";

const Contact: React.FC = () => {
  return (
    <div className="App">
      <link
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      ></link>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      ></link>
      <div className="background contact">
        <div className="navbar">
          <div className="nav-left">
            <Logo />
          </div>
          <div className="nav-right">
            <BurgerMenu />
            <div className="nav-right"></div>
          </div>
        </div>
        <TitleCard title="Contact Us" />
        <div className="contact-info">
          <div className="socials container top">
            <i className="fa fa-instagram socials icon"></i>
            <div className="contact-text">
              <h6>Instagram</h6>
              <Link to="https://www.instagram.com/wesmo_fsae/" className="link">
                @wesmofsae
              </Link>
            </div>
          </div>
          <div className="socials container middle">
            <i className="fa fa-facebook-square socials icon"></i>
            <div className="contact-text">
              <h6>Facebook</h6>
              <Link to="https://www.facebook.com/wesmofsae" className="link">
                wesmofsae
              </Link>
            </div>
          </div>
          <div className="socials container bottom">
            <i className="fa fa-envelope-square socials icon"></i>
            <div className="contact-text">
              <h6>Email</h6>
              <Link to="mailto:wesmofsae@gmail.com" className="link">
                wesmofsae@gmail.com
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
