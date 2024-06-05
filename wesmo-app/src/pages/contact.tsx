// Filename - pages/contact.js

import React from "react";
import BurgerMenu from "../components/BurgerMenu.tsx";
import "../App.css";

const Contact: React.FC = () => {
  return (
    <div className="App">
      <link // Roboto-condensed font
        href="https://fonts.googleapis.com/css?family=Roboto Condensed"
        rel="stylesheet"
      ></link>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      ></link>
      <div className="background-contact">
        <div className="navbar">
          <div className="nav-left">
            <p id="logo">
              <a href="/">
                <img
                  id="imgLogo"
                  src={require("..//images/WESMOLogo.png")}
                  alt="Wesmo logo"
                />
              </a>
            </p>
          </div>
          <div className="nav-right">
            <BurgerMenu />
            <div className="nav-right"></div>
          </div>
        </div>
        <div className="title-card">Contact Us</div>

        <div className="dark-grey">
          <div className="socials-container">
            <i className="fa fa-instagram socials-icon"></i>
            <div className="contact-text">
              <h6>Instagram</h6>
              @wesmofsae
            </div>
          </div>
          <div className="socials-container">
            <i className="fa fa-facebook-square socials-icon"></i>
            <div className="contact-text">
              <h6>Facebook</h6>
              wesmofsae
            </div>
          </div>
          <div className="socials-container">
            <i className="fa fa-envelope-square socials-icon"></i>
            <div className="contact-text">
              <h6>Email</h6>
              wesmofsae@gmail.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
