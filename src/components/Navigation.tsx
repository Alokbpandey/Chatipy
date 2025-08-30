import React from 'react';
import { Terminal, Info, Play, Home } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'landing', label: 'HOME', icon: Home },
    { id: 'about', label: 'ABOUT', icon: Info },
    { id: 'demo', label: 'GENERATOR', icon: Terminal },
  ];

  return (
    <nav className="bg-gray-800 border-b-4 border-lime-400 p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-lime-400 border-2 border-lime-300 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-gray-900" />
          </div>
          <h1 className="text-xl font-bold text-lime-400 tracking-wider">
            ╔══ CHATIFY ══╗
          </h1>
        </div>
        
        <div className="flex space-x-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`
                px-4 py-2 border-2 transition-all duration-200 font-bold tracking-wide
                ${currentPage === id 
                  ? 'bg-lime-400 text-gray-900 border-lime-300 shadow-lg shadow-lime-400/20' 
                  : 'bg-gray-700 text-lime-400 border-gray-600 hover:bg-gray-600 hover:border-lime-400'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;