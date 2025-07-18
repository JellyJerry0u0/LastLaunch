import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import WaitingRoom from './pages/WaitingRoom';

import './App.css';
import TitleScreen from './pages/TitleScreen';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/lobby/:userId" element={<LobbyPage />} />
        <Route path="/waiting/:roomId/:userId" element={<WaitingRoom />} />
        <Route path="/" element={<TitleScreen />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}
export default App;
