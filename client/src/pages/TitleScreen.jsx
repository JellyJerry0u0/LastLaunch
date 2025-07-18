import React, { useEffect, useState } from "react";
import "./TitleScreen.css";

const TITLE = "Last_Launch";
const TYPING_SPEED = 100; // ms per character
const GLITCH_DURATION = 1200; // ms

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=~";

function getRandomGlitchText(length) {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }
  return text;
}

const TitleScreen = () => {
  const [glitch, setGlitch] = useState(true);
  const [typed, setTyped] = useState("");
  const [glitchText, setGlitchText] = useState("");

  // 치지직 효과
  useEffect(() => {
    if (!glitch) return;
    let interval = setInterval(() => {
      setGlitchText(getRandomGlitchText(TITLE.length));
    }, 50);
    let timeout = setTimeout(() => {
      setGlitch(false);
      setGlitchText("");
      clearInterval(interval);
    }, GLITCH_DURATION);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [glitch]);

  // 타이핑 효과
  useEffect(() => {
    if (glitch) return;
    if (typed.length === TITLE.length) return;
    const timeout = setTimeout(() => {
      setTyped(TITLE.slice(0, typed.length + 1));
    }, TYPING_SPEED);
    return () => clearTimeout(timeout);
  }, [glitch, typed]);

  return (
    <div className="title-black-bg">
      <div className="title-center">
        <span className="title-coding-font">
          {glitch ? glitchText : typed}
        </span>
        <span className="title-cursor" style={{opacity: glitch ? 0 : 1}}>|</span>
      </div>
    </div>
  );
};

export default TitleScreen; 