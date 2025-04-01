import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import BrowsePage from './pages/BrowsePage';
import StatsPage from './pages/StatsPage';
import ActivityPage from './pages/ActivityPage';
import MintPage from './pages/MintPage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw', 
      overflow: 'hidden', 
      margin: 0,         
      padding: 0,      
    }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/browse" element={<><Navbar /><BrowsePage /></>} />
        <Route path="/stats" element={<><Navbar /><StatsPage /></>} />
        <Route path="/activity" element={<><Navbar /><ActivityPage /></>} />
        <Route path="/mint" element={<><Navbar /><MintPage /></>} />
        <Route path="/profile" element={<><Navbar /><ProfilePage /></>} />

      </Routes>
    </div>
  );
}

export default App;