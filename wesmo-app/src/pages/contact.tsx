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

import Logo from "../components/Logo.tsx";
import TitleCard from "../components/TitleCard.tsx";
import "../App.css";
import { useState } from "react";
import "./Contact.css";

type Status = { type: "idle" | "sending" | "ok" | "error"; msg?: string };

const IG = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
  </svg>
);

const FB = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M14.5 9H16.5V6H13.5C11.57 6 10 7.57 10 9.5V11H8V14H10V21H13V14H15.5L16.5 11H13V9.5C13 9.22 13.22 9 13.5 9H14.5Z"
      fill="currentColor"/>
  </svg>
);

const Mail = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 8l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Contact() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" }); // company = honeypot

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ type: "ok", msg: "Email copied!" });
      setTimeout(() => setStatus({ type: "idle" }), 1500);
    } catch {
      setStatus({ type: "error", msg: "Couldn’t copy, long-press to copy." });
      setTimeout(() => setStatus({ type: "idle" }), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const subject = encodeURIComponent(`WESMO contact — ${form.name}`);
    const body = encodeURIComponent(
      `${form.message}\n\nFrom: ${form.name} <${form.email}>`
    );

    // Prefer Gmail compose if available, fallback to mailto:
    const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=teamwesmo@gmail.com&su=${subject}&body=${body}`;
    const mailto = `mailto:teamwesmo@gmail.com?subject=${subject}&body=${body}`;

    try {
      // This will work if they’re logged into Gmail on desktop
      window.open(gmailCompose, "_blank", "noopener,noreferrer");
      setStatus({ type: "ok", msg: "Opening your email app…" });
    } catch {
      window.location.href = mailto;
      setStatus({ type: "ok", msg: "Opening your email app…" });
    }

  };

  return (
    <div className="contact-page">
      <div className="background" aria-hidden />
      <TitleCard title="Contact Us" />

      <div className="contact-shell">
        {/* LEFT: social / direct contact */}
        <section className="contact-cards">
          <a className="contact-card" href="https://www.instagram.com/wesmo_fsae/?hl=en" target="_blank" rel="noreferrer">
            <div className="icon"><IG /></div>
            <div className="body">
              <p className="kicker">Instagram</p>
              <p className="title">@wesmofsae</p>
              <span className="chip">Open in new tab</span>
            </div>
          </a>

          <a className="contact-card" href="https://facebook.com/wesmofsae" target="_blank" rel="noreferrer">
            <div className="icon"><FB /></div>
            <div className="body">
              <p className="kicker">Facebook</p>
              <p className="title">wesmofsae</p>
              <span className="chip">Open in new tab</span>
            </div>
          </a>

          <button
            className="contact-card"
            type="button"
            onClick={() => handleCopy("teamwesmo@gmail.com")}
            aria-label="Copy email to clipboard"
          >
            <div className="icon"><Mail /></div>
            <div className="body">
              <p className="kicker">Email</p>
              <p className="title">teamwesmo@gmail.com</p>
              <span className="chip">Click to copy</span>
            </div>
          </button>
        </section>

        {/* RIGHT: message form */}
        <section className="contact-form-card">
          <h3>Send us a message</h3>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid">
              <label>
                <span>Your name</span>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Alex Driver"
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                <span>Your email</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            {/* honeypot */}
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              className="honeypot"
              placeholder="Company"
              tabIndex={-1}
              autoComplete="off"
            />

            <label>
              <span>Message</span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us how we can help…"
                rows={6}
                required
              />
            </label>

            <div className="actions">
              <button className="btn" type="submit" disabled={status.type === "sending"}>
                {status.type === "sending" ? "Sending…" : "Send message"}
              </button>
              {status.type !== "idle" && (
                <span
                  className={`status ${status.type === "ok" ? "ok" : status.type === "error" ? "err" : ""}`}
                  role="status"
                >
                  {status.msg}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* FULL-WIDTH: map */}
        <section className="map-card">
          <iframe
            title="WESMO — University of Waikato"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=University%20of%20Waikato&output=embed"
          />
        </section>
      </div>
    </div>
  );
}
