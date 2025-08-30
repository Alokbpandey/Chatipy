import React, { useState } from 'react';
import { Terminal, Info, Play, Home, Bot } from 'lucide-react';
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';
import DemoPage from './components/DemoPage';
import Navigation from './components/Navigation';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <AboutPage />;
      case 'demo':
        return <DemoPage />;
      default:
        return <LandingPage onNavigateToDemo={() => setCurrentPage('demo')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-lime-400 font-mono">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;