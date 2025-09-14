import React from "react";
import "../pages/AboutWesmo.css";

// 👇 swap these for the actual files you want to use
import HeroImg from "../images/backgrounds/pushing_car.jpg";
import BuildImg from "../images/2015_car.jpg";
import EvImg from "../images/car_in_motion.jpg"; 

const AboutWesmo: React.FC = () => {
  return (
    <div className="about">
      {/* HERO */}
      <section
        className="about-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.65)), url(${HeroImg})`,
        }}
      >
        <div className="about-hero__glass">
          <p className="eyebrow">Waikato Engineering School Motorsport Organisation</p>
          <h1>About WESMO</h1>
          <p className="lead">
            We design, build, and race Formula SAE cars while growing world-class engineers.
            From combustion to EV, our team blends innovation, grit, and good vibes.
          </p>

          <div className="cta-row">
            <a className="btn btn--light" href="/sponsors">Our Sponsors</a>
            <a className="btn btn--ghost btn--ghost-strong" href="/contact-us">Join / Contact</a>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="about-stats container">
        <div className="stat">
          <div className="stat__num">2006</div>
          <div className="stat__label">Founded</div>
        </div>
        <div className="stat">
          <div className="stat__num">EV</div>
          <div className="stat__label">Transition in 2024</div>
        </div>
        <div className="stat">
          <div className="stat__num">25+</div>
          <div className="stat__label">Active Members</div>
        </div>
        <div className="stat">
          <div className="stat__num">FSAE</div>
          <div className="stat__label">Competition Focus</div>
        </div>
      </section>

      {/* FEATURE 1 */}
      <section className="container feature feature--alt">
        <div className="feature__media">
          <img src={BuildImg} alt="WESMO car on track" className="about-media__img" />
        </div>
        <div className="feature__copy">
          <h2>We build race cars, and engineers.</h2>
          <p>
            WESMO is a student-run team building a Formula SAE car each season. You’ll touch CAD,
            composites, wiring, software, finance, media — and learn by shipping real hardware on real
            deadlines.
          </p>
          <ul className="bullets">
            <li>Mechanical, Mechatronics, Software, Business</li>
            <li>Design reviews, track testing, competition scrutineering</li>
            <li>Strong industry mentorship and sponsor support</li>
          </ul>
        </div>
      </section>

      {/* FEATURE 2 */}
      <section className="container feature">
        <div className="feature__copy">
          <h2>EV platform & data-driven development.</h2>
          <p>
            We’re transitioning to a fully electric platform — high-voltage safety, powertrain controls,
            telemetry and data visualisation. If you like clean architecture and fast feedback, you’ll
            fit right in.
          </p>
          <ul className="chips">
            <li>Accumulator</li>
            <li>Motor Controller</li>
            <li>BMS / Safety</li>
            <li>DAQ & Visualisation</li>
          </ul>
        </div>
        <div
          className="feature__media feature__media--two"
          role="img"
          aria-label="EV platform and track testing"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)), url(${EvImg})`,
          }}
        />
      </section>

      {/* TIMELINE */}
      <section className="container timeline">
        <h3 className="section-title">Milestones</h3>
        <ol className="timeline__list">
          <li><span className="dot" /><div><strong>2006</strong> — WESMO founded.</div></li>
          <li><span className="dot" /><div><strong>2023</strong> — Strong IC results, platform maturity.</div></li>
          <li><span className="dot" /><div><strong>2024</strong> — EV transition begins; new HV architecture.</div></li>
          <li><span className="dot" /><div><strong>2025</strong> — Focus: reliability, testing cadence, data-driven iteration.</div></li>
        </ol>
      </section>

      {/* CTA STRIP */}
      <section className="container cta-strip">
        <h3>Want to help us go faster?</h3>
        <div className="cta-row">
          <a className="btn btn--brand" href="/sponsors">Become a Sponsor</a>
          <a className="btn btn--ghost btn--ghost-strong" href="/engineering-team">Meet the Team</a>
        </div>
      </section>
    </div>
  );
};

export default AboutWesmo;
