import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio } from "../contexts/AudioContext";

const TYPING_SPEED = 70; // ms per character
const TV_ON_DURATION = 700; // ms
const TV_OFF_DURATION = 700; // ms
const LABELS = [
  { key: 'id', text: 'ID' },
  { key: 'pw', text: 'PW' },
  { key: 'name', text: 'Name' },
  { key: 'btn', text: 'Sign Up' },
];

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=~";
const GLITCH_DURATION = 700; // ms
const TYPING_SPEED_CMD = 32; // ms per character
const TYPING_SPEED_YESNO = 48;
const CMD_LINES = [
  "회원가입이 완료되었습니다",
  "마지막으로 수정한 파일을 열어보시겠습니까?"
];

const SignUp = () => {
  const [form, setForm] = useState({ id: '', pw: '', name: '' });
  const [typedLabels, setTypedLabels] = useState(['', '', '', '']);
  const [focus, setFocus] = useState({ id: false, pw: false, name: false });
  const [tvOn, setTvOn] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tvOff, setTvOff] = useState(false);
  const [showCmdBox, setShowCmdBox] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null); // 'yes' 또는 'no'
  const navigate = useNavigate();
  const [glitch, setGlitch] = useState(true);
  const [glitchText, setGlitchText] = useState(["", ""]);
  const [typedLines, setTypedLines] = useState(["", ""]);
  const [typingDone, setTypingDone] = useState(false);
  const [typedYes, setTypedYes] = useState("");
  const [typedNo, setTypedNo] = useState("");
  const [showFileBox, setShowFileBox] = useState(false);
  const [fileCancelHover, setFileCancelHover] = useState(false);
  const [fileBoxText, setFileBoxText] = useState('인류는 멸망하지 않았다.');
  const [typedFileBoxText, setTypedFileBoxText] = useState('');
  const TYPING_SPEED_FILEBOX = 24; // ms per character
  const [fileBoxStep, setFileBoxStep] = useState(0); // 단계 상태 추가
  const { stopMusic } = useAudio();

  // 페이지 진입 시 음악 정지
  useEffect(() => {
    stopMusic();
  }, [stopMusic]);

  // TV ON 애니메이션 후 폼 표시
  useEffect(() => {
    const timeout = setTimeout(() => setTvOn(false), TV_ON_DURATION);
    return () => clearTimeout(timeout);
  }, []);

  // 타이핑 애니메이션 (순차적으로)
  useEffect(() => {
    if (tvOn) return;
    let idx = 0;
    let charIdx = 0;
    let typing = true;
    let newTyped = ['', '', '', ''];
    function typeNext() {
      if (!typing) return;
      if (idx >= LABELS.length) return;
      if (charIdx < LABELS[idx].text.length) {
        newTyped[idx] = LABELS[idx].text.slice(0, charIdx + 1);
        setTypedLabels([...newTyped]);
        charIdx++;
        setTimeout(typeNext, TYPING_SPEED);
      } else {
        idx++;
        charIdx = 0;
        setTimeout(typeNext, TYPING_SPEED * 2);
      }
    }
    typeNext();
    return () => { typing = false; };
  }, [tvOn]);

  // 회원가입 성공 시 TV OFF → cmd 박스 표시
  useEffect(() => {
    if (message !== 'sign up complete') return;
    setTimeout(() => setTvOff(true), 400); // 약간의 딜레이 후 TV OFF
  }, [message]);

  // TV OFF 끝나면 cmd 박스 표시
  useEffect(() => {
    if (!tvOff) return;
    const timeout = setTimeout(() => setShowCmdBox(true), TV_OFF_DURATION);
    return () => clearTimeout(timeout);
  }, [tvOff]);

  // cmd 박스 등장 시 글리치 효과
  useEffect(() => {
    if (!showCmdBox) return;
    setGlitch(true);
    setTypedLines(["", ""]);
    setTypingDone(false);
    setTypedYes("");
    setTypedNo("");
    let interval = setInterval(() => {
      setGlitchText([
        Array(CMD_LINES[0].length).fill().map(() => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join(''),
        Array(CMD_LINES[1].length).fill().map(() => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join('')
      ]);
    }, 40);
    let timeout = setTimeout(() => {
      setGlitch(false);
      setGlitchText(["", ""]);
      clearInterval(interval);
    }, GLITCH_DURATION);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [showCmdBox]);

  // cmd 텍스트 타이핑 애니메이션
  useEffect(() => {
    if (!showCmdBox || glitch) return;
    let idx = 0;
    let charIdx = 0;
    let typing = true;
    let newTyped = ["", ""];
    function typeNext() {
      if (!typing) return;
      if (idx >= CMD_LINES.length) {
        setTypingDone(true);
        return;
      }
      if (charIdx < CMD_LINES[idx].length) {
        newTyped[idx] = CMD_LINES[idx].slice(0, charIdx + 1);
        setTypedLines([...newTyped]);
        charIdx++;
        setTimeout(typeNext, TYPING_SPEED_CMD);
      } else {
        idx++;
        charIdx = 0;
        setTimeout(typeNext, TYPING_SPEED_CMD * 2);
      }
    }
    typeNext();
    return () => { typing = false; };
  }, [showCmdBox, glitch]);

  // yes/no 타이핑 애니메이션
  useEffect(() => {
    if (!typingDone) return;
    let yes = "yes";
    let no = "no";
    let y = 0, n = 0;
    let typing = true;
    function typeYes() {
      if (!typing) return;
      if (y < yes.length) {
        setTypedYes(yes.slice(0, y + 1));
        y++;
        setTimeout(typeYes, TYPING_SPEED_YESNO);
      } else {
        setTimeout(typeNo, TYPING_SPEED_YESNO * 2);
      }
    }
    function typeNo() {
      if (!typing) return;
      if (n < no.length) {
        setTypedNo(no.slice(0, n + 1));
        n++;
        setTimeout(typeNo, TYPING_SPEED_YESNO);
      }
    }
    typeYes();
    return () => { typing = false; };
  }, [typingDone]);

  // 파일 박스 단계별 텍스트 및 버튼
  useEffect(() => {
    if (!showFileBox) {
      setFileBoxStep(0);
      setFileBoxText('인류는 멸망하지 않았다.');
      setTypedFileBoxText('');
    }
  }, [showFileBox]);

  // fileBoxText가 바뀔 때마다 타이핑 효과 적용
  useEffect(() => {
    if (!showFileBox) return;
    setTypedFileBoxText('');
    let idx = 0;
    let typing = true;
    function typeNext() {
      if (!typing) return;
      if (idx <= fileBoxText.length) {
        setTypedFileBoxText(fileBoxText.slice(0, idx));
        idx++;
        setTimeout(typeNext, TYPING_SPEED_FILEBOX);
      }
    }
    typeNext();
    return () => { typing = false; };
  }, [fileBoxText, showFileBox]);

  const handleFileBoxNext = () => {
    if (fileBoxStep === 0) {
      setFileBoxText('2038년, 북극 탐사 기지에서 정체불명의 미지의 물질이 발견된다.\n \n2057년, 비밀리에 구성된 국제 연구팀이 이 물질이 기존 연료 대비 100배 이상의 효율을 가진 에너지원이며,\n달에 막대한 양이 매장되어 있음을 공식 확인한다.\n\n2069년, 지속적인 지구 온난화와 연이은 자연재해, 그리고 심각한 에너지고갈 위기에 대응하여 \n국제연합이 [달 이주 프로젝트]를 선언한다.\n \n2075년, 달 이주를 위한 최초의 정식 이주선 Solarite-K02가 성공적으로 발사된다.\n \n2112년, 인류의 38%가 이주에 성공한다.\n하지만 달에서 온 공식 기록은 믿을 수 없다.\n지구에 남은 인류를 지칭하는 [지구인]이 공식 고유명사로 기록된다.\n \n2178년, 인류의 73%가 이주에 성공한다.\n하지만 달에서 온 공식 기록은 믿을 수 없다.\n달 연합정부의 공식 역사 교육 과정에서 지구 역사는 단 한 줄로 축약된다.\n \n2201년, 달 연합정부는 이번 이주선 발사를 끝으로, 모든 지구인을 성공적으로 달로 이주시켰다고 발표한다.\n \n하지만 달에서 온 공식 기록은 믿을 수 없다.');
      setFileBoxStep(1);
    } else if (fileBoxStep === 1) {
      setFileBoxText('나는 이제 마지막으로 달로 향한다.\n \n지금까지의 모든 연구 지식을 동원하여 저장장치에 남긴 우주선 설계도가,\n지구에 홀로 남겨진 누군가에게 도움이 되길 진심으로 기원한다.\n \n지구에서의 마지막 발사에 행운이 함께하길.');
      setFileBoxStep(2);
    } else if (fileBoxStep === 2) {
      navigate('/signin');
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFocus = e => {
    setFocus(f => ({ ...f, [e.target.name]: true }));
  };
  const handleBlur = e => {
    setFocus(f => ({ ...f, [e.target.name]: false }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('sign up complete');
        setForm({ id: '', pw: '', name: '' });
      } else {
        setMessage(data.message || 'sign up failed');
      }
    } catch (err) {
      setMessage('server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-bg">
      <style>{`
        .signup-bg {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0; left: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .tv-on-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          z-index: 9999;
          pointer-events: all;
          animation: tv-on-anim 0.7s cubic-bezier(.4,2,.6,1) forwards;
        }
        .tv-off-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          z-index: 9999;
          pointer-events: all;
          animation: tv-off-anim 0.7s cubic-bezier(.4,2,.6,1) forwards;
        }
        @keyframes tv-on-anim {
          0% {
            transform: scaleY(0);
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          80% {
            transform: scaleY(0.04);
            opacity: 1;
          }
          100% {
            transform: scaleY(1);
            opacity: 0;
          }
        }
        @keyframes tv-off-anim {
          0% {
            transform: scaleY(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          80% {
            transform: scaleY(0.04);
            opacity: 1;
          }
          100% {
            transform: scaleY(0);
            opacity: 1;
          }
        }
        .signup-form {
          min-width: 320px;
          padding: 32px;
          border-radius: 12px;
          background: rgba(0,0,0,0.7);
          box-shadow: 0 0 32px #000;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .signup-label {
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1.1rem;
          margin: 0 0 4px 0;
          text-align: left;
          display: inline-block;
          min-width: 90px;
          letter-spacing: 0.04em;
        }
        .signup-input-wrap {
          display: inline-block;
          position: relative;
          width: 180px;
          margin-left: 4px;
        }
        .signup-input {
          width: 100%;
          padding: 6px 0 6px 0;
          font-size: 1.1rem;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          background: transparent;
          color: #fff;
          border: none;
          outline: none;
          box-sizing: border-box;
          text-align: center;
        }
        .signup-input-wrap:after {
          content: '';
          display: block;
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 2px;
          background: #fff;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.25s cubic-bezier(.4,2,.6,1);
        }
        .signup-input-wrap.focused:after {
          transform: scaleX(1);
        }
        .signup-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .signup-btn {
          background: none;
          border: none;
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1.1rem;
          cursor: pointer;
          margin: 24px 0 0 0;
          padding: 0;
          font-weight: 700;
          transition: text-shadow 0.2s;
          letter-spacing: 0.04em;
        }
        .signup-btn:hover {
          text-shadow: 0 0 12px #fff, 0 0 8px #fff;
        }
        .signup-message {
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1rem;
          margin-top: 16px;
          min-height: 1.2em;
        }
        /* cmd 창 스타일 */
        .cmd-box {
          min-width: 340px;
          min-height: 120px;
          background: #181818;
          border-radius: 8px;
          box-shadow: 0 0 24px #000, 0 0 8px #fff;
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1.15rem;
          padding: 2.5em 2em 2em 2em;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          position: relative;
          text-shadow: 0 0 2px #fff, 0 0 8px #fff;
          overflow: hidden;
        }
        .cmd-box .cmd-title {
          color: #fff;
          font-size: 1.05rem;
          margin-bottom: 0.7em;
          opacity: 0.8;
        }
        .cmd-box .cmd-cursor {
          display: inline-block;
          width: 1ch;
          animation: blink 1s steps(1) infinite;
        }
        .cmd-box .cmd-glitch {
          color: #fff;
          opacity: 0.85;
          letter-spacing: 0.04em;
          font-family: inherit;
          font-size: 1.15rem;
          text-shadow: 0 0 8px #fff, 0 0 2px #fff;
          user-select: none;
          margin-bottom: 0.2em;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .cmd-box .cmd-btn {
          margin-top: 2em;
          background: none;
          border: 1px solid #fff;
          color: #fff;
          font-family: inherit;
          font-size: 1rem;
          border-radius: 4px;
          padding: 0.4em 1.2em;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .cmd-box .cmd-btn:hover {
          background: #fff;
          color: #181818;
        }
        .cmd-box-btn-row {
          display: flex;
          flex-direction: row;
          gap: 2.5em;
          margin-top: 2.2em;
        }
        .cmd-choice-btn {
          background: none;
          border: none;
          color: #fff;
          font-family: inherit;
          font-size: 1.08rem;
          border-radius: 4px;
          padding: 0.4em 1.2em 0.4em 0.7em;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          outline: none;
          position: relative;
          min-width: 3.5em;
          text-align: left;
        }
        .cmd-choice-btn:hover, .cmd-choice-btn:focus {
          background: #fff2;
          color: #fff;
        }
        .cmd-choice-btn .cmd-choice-arrow {
          display: inline-block;
          width: 1.2em;
          color: #fff;
          font-weight: bold;
          margin-right: 0.2em;
          opacity: 1;
          transition: opacity 0.15s;
        }
        .cmd-choice-btn .cmd-choice-arrow.invisible {
          opacity: 0;
        }
        .file-box {
          min-width: 340px;
          min-height: 180px;
          background: #23272e;
          border-radius: 8px;
          box-shadow: 0 0 24px #000, 0 0 8px #fff;
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1.08rem;
          padding: 2.2em 2em 2em 2em;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 2000;
          border: 1.5px solid #fff3;
          animation: filebox-fadein 0.4s cubic-bezier(.4,2,.6,1);
        }
        @keyframes filebox-fadein {
          from { opacity: 0; transform: translate(-50%, -60%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .file-box-filename {
          color: #7fffd4;
          font-size: 1.08rem;
          margin-bottom: 1.1em;
          opacity: 0.85;
          text-shadow: 0 0 2px #fff, 0 0 8px #fff;
        }
        .file-box-content {
          color: #fff;
          font-size: 1.01rem;
          background: #181818;
          border-radius: 4px;
          padding: 1.1em 1.2em;
          width: 100%;
          min-height: 60px;
          box-shadow: 0 0 8px #000a;
          margin-bottom: 1.2em;
          white-space: pre-line;
        }
        .file-box-btn {
          margin-top: 0.5em;
          background: none;
          border: 1px solid #fff;
          color: #fff;
          font-family: inherit;
          font-size: 1rem;
          border-radius: 4px;
          padding: 0.4em 1.2em;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .file-box-btn:hover {
          background: #fff;
          color: #181818;
        }
        .file-box-cancel {
          position: absolute;
          right: 1.6em;
          bottom: 1.2em;
          color: #fff;
          font-family: inherit;
          font-size: 1.01rem;
          opacity: 0.8;
          cursor: pointer;
          user-select: none;
          transition: color 0.18s, opacity 0.18s;
          padding: 0.1em 0.6em;
          border-radius: 4px;
        }
        .file-box-cancel:hover, .file-box-cancel:focus {
          color: #fff;
          opacity: 1;
          background: #fff2;
        }
      `}</style>
      {tvOn && <div className="tv-on-overlay" />}
      {tvOff && <div className="tv-off-overlay" />}
      {showCmdBox && !showFileBox ? (
        <div className="cmd-box">
          <div className="cmd-title">[ LastLaunch CMD ]</div>
          {glitch ? (
            <>
              <div className="cmd-glitch">{glitchText[0]}</div>
              <div className="cmd-glitch">{glitchText[1]}</div>
            </>
          ) : (
            <>
              <div>{typedLines[0]}</div>
              <div>{typedLines[1]}<span className="cmd-cursor">|</span></div>
              <div className="cmd-box-btn-row">
                <button
                  className="cmd-choice-btn"
                  onMouseEnter={() => setHoveredBtn('yes')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onFocus={() => setHoveredBtn('yes')}
                  onBlur={() => setHoveredBtn(null)}
                  disabled={typedYes.length < 3}
                  onClick={() => setShowFileBox(true)}
                >
                  <span className={`cmd-choice-arrow${hoveredBtn === 'yes' ? '' : ' invisible'}`}>&gt;</span>{typedYes}
                </button>
                <button
                  className="cmd-choice-btn"
                  onMouseEnter={() => setHoveredBtn('no')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onFocus={() => setHoveredBtn('no')}
                  onBlur={() => setHoveredBtn(null)}
                  disabled={typedNo.length < 2}
                  onClick={() => navigate('/signin')}
                >
                  <span className={`cmd-choice-arrow${hoveredBtn === 'no' ? '' : ' invisible'}`}>&gt;</span>{typedNo}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
      {showFileBox && (
        <div className="file-box">
          <div className="file-box-filename">마지막으로 수정한 파일: <b>Last-Launch.txt</b></div>
          <div style={{ textAlign: 'left', width: '100%' }}>
            {typedFileBoxText.split('\n').map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
          <div
            className="file-box-cancel"
            onMouseEnter={() => setFileCancelHover(true)}
            onMouseLeave={() => setFileCancelHover(false)}
            onClick={handleFileBoxNext}
          >
            {fileBoxStep < 2
              ? (fileCancelHover ? '> next' : 'next')
              : (fileCancelHover ? '> cancel' : 'cancel')}
          </div>
        </div>
      )}
      {!showCmdBox && !showFileBox && !tvOn && !tvOff && (
        <form className="signup-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="signup-row">
            <label className="signup-label" htmlFor="id">{typedLabels[0]}</label>
            <span className={`signup-input-wrap${focus.id ? ' focused' : ''}`}>
              <input className="signup-input" id="id" name="id" autoComplete="username" value={form.id} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} required />
            </span>
          </div>
          <div className="signup-row">
            <label className="signup-label" htmlFor="pw">{typedLabels[1]}</label>
            <span className={`signup-input-wrap${focus.pw ? ' focused' : ''}`}>
              <input className="signup-input" id="pw" name="pw" type="password" autoComplete="new-password" value={form.pw} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} required />
            </span>
          </div>
          <div className="signup-row">
            <label className="signup-label" htmlFor="name">{typedLabels[2]}</label>
            <span className={`signup-input-wrap${focus.name ? ' focused' : ''}`}>
              <input className="signup-input" id="name" name="name" value={form.name} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} required />
            </span>
          </div>
          <button type="submit" className="signup-btn" disabled={loading}>
            {typedLabels[3]}
          </button>
          <div className="signup-message">{message}</div>
        </form>
      )}
    </div>
  );
};

export default SignUp; 