import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import RepositoryAnalysis from './pages/RepositoryAnalysis';
import WorkspaceEditor from './pages/WorkspaceEditor';
import Recommendations from './pages/Recommendations';
import DeploymentPlan from './pages/DeploymentPlan';
import ChatAssistant from './pages/ChatAssistant';
import './styles/global.css';

const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="app-container">
      {!isLandingPage && <Sidebar />}
      <main className={`main-content ${isLandingPage ? 'full-width' : ''}`}>
        {!isLandingPage && <Navbar />}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyze" element={<RepositoryAnalysis />} />
          <Route path="/editor" element={<WorkspaceEditor />} />
          <Route path="/recommend" element={<Recommendations />} />
          <Route path="/plan" element={<DeploymentPlan />} />
          <Route path="/chat" element={<ChatAssistant />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
