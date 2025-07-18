import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TitleScreen.css";

const TITLE = "Last_Launch";
const TYPING_SPEED = 100; // ms per character
const GLITCH_DURATION = 1200; // ms
const TV_OFF_DURATION = 700; // ms
const MENU_TYPING_SPEED = 60; // ms per character for menu

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=~";

function getRandomGlitchText(length) {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }
  return text;
}

const menuItems = [
  { label: "Sign in", path: "/signin", key: "signin" },
  { label: "Sign up", path: "/signup", key: "signup" },
];

const TitleScreen = () => {
  const [glitch, setGlitch] = useState(true);
  const [typed, setTyped] = useState("");
  const [glitchText, setGlitchText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [hovered, setHovered] = useState("");
  const [menuTyped, setMenuTyped] = useState(["", ""]);
  const [menuCursor, setMenuCursor] = useState(-1); // -1이면 커서 없음, 0/1이면 해당 메뉴에 커서
  const [tvOff, setTvOff] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const navigate = useNavigate();

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

  // 메뉴 타이핑 효과
  useEffect(() => {
    if (!showMenu) return;
    let idx = 0;
    let charIdx = 0;
    let typing = true;
    let newMenuTyped = ["", ""];
    function typeMenu() {
      if (!typing) return;
      if (idx >= menuItems.length) return;
      if (charIdx < menuItems[idx].label.length) {
        newMenuTyped[idx] = menuItems[idx].label.slice(0, charIdx + 1);
        setMenuTyped([...newMenuTyped]);
        charIdx++;
        setTimeout(typeMenu, MENU_TYPING_SPEED);
      } else {
        idx++;
        charIdx = 0;
        setTimeout(typeMenu, MENU_TYPING_SPEED * 2);
      }
    }
    typeMenu();
    return () => { typing = false; };
  }, [showMenu]);

  // 타이틀 애니메이션 끝나면 클릭 가능
  const canClick = !glitch && typed.length === TITLE.length && !showMenu && !tvOff;

  // 클릭 시 메뉴 표시
  const handleClick = () => {
    if (!canClick) return;
    setShowMenu(true);
  };

  // 메뉴 클릭 시 TV OFF 애니메이션 후 라우팅
  const handleMenu = (path) => {
    setTvOff(true);
    setPendingRoute(path);
    setTimeout(() => {
      navigate(path);
    }, TV_OFF_DURATION);
  };

  // 메뉴 hover 시 커서 표시
  const handleMenuEnter = (idx) => {
    setHovered(menuItems[idx].key);
    setMenuCursor(idx);
  };
  const handleMenuLeave = () => {
    setHovered("");
    setMenuCursor(-1);
  };

  return (
    <div className="title-black-bg" onClick={handleClick} style={{cursor: canClick ? 'pointer' : 'default'}}>
      {/* TV OFF 애니메이션 오버레이 */}
      {tvOff && <div className="tv-off-overlay" />}
      {!showMenu ? (
        <div className="title-center">
          <span className="title-coding-font">
            {glitch ? glitchText : typed}
          </span>
          <span className="title-cursor" style={{opacity: glitch ? 0 : 1}}>|</span>
        </div>
      ) : (
        <div className="title-menu-center">
          {menuItems.map((item, idx) => (
            <span
              key={item.key}
              className={`title-menu-item${hovered === item.key ? ' hovered' : ''}`}
              onMouseEnter={() => handleMenuEnter(idx)}
              onMouseLeave={handleMenuLeave}
              onClick={() => handleMenu(item.path)}
            >
              <span className="title-menu-typing">{menuTyped[idx]}</span>
              {menuCursor === idx && menuTyped[idx].length === item.label.length && <span className="title-menu-blink">|</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TitleScreen; 
