import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { ThemeToggle } from '../common/ThemeToggle';

export function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isSearch = location.pathname === '/search';
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#1E3A8A] dark:border-border bg-[#1E3A8A] dark:bg-bg-primary transition-colors duration-150">
      <div className="max-w-[1200px] mx-auto px-6 h-[56px] flex flex-row items-center justify-between">
        <Link to="/" className="flex flex-row items-baseline gap-3 group">
          <span className="font-display font-bold text-[18px] text-white dark:text-text-primary transition-colors duration-150">
            ProtPocket
          </span>
          <span className="font-mono text-xs text-[#DBEAFE] dark:text-text-muted group-hover:text-white dark:group-hover:text-text-secondary transition-colors duration-150">
            protein complex intelligence
          </span>
        </Link>
        <div className="flex flex-row items-center gap-6">
          <Link 
            to="/search" 
            className={`text-sm h-[56px] flex items-center border-b-[2px] transition-colors duration-150 ${
              isSearch 
                ? 'text-white border-[#3B82F6] dark:border-accent dark:text-text-primary' 
                : 'text-[#DBEAFE] dark:text-text-secondary border-transparent hover:text-white dark:hover:text-text-primary'
            }`}
          >
            Search
          </Link>
          <Link 
            to="/dashboard" 
            className={`text-sm h-[56px] flex items-center border-b-[2px] transition-colors duration-150 ${
              isDashboard 
                ? 'text-white border-[#3B82F6] dark:border-accent dark:text-text-primary' 
                : 'text-[#DBEAFE] dark:text-text-secondary border-transparent hover:text-white dark:hover:text-text-primary'
            }`}
          >
            Undrugged Targets
          </Link>
          <div className="ml-4 flex items-center">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>
      </div>
    </nav>
  );
}
