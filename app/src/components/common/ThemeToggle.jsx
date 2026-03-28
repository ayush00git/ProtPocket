import React from 'react';

export function ThemeToggle({ theme, toggleTheme }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
        isDark ? 'bg-bg-tertiary' : 'bg-border'
      }`}
    >
      <span className="sr-only">Toggle dark mode</span>
      
      {/* Sun Icon (Left position for light mode) */}
      <span className="absolute left-1 flex h-6 w-6 items-center justify-center pointer-events-none">
        <svg 
          className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100 text-warning'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </span>

      {/* Moon Icon (Right position for dark mode) */}
      <span className="absolute right-1 flex h-6 w-6 items-center justify-center pointer-events-none">
        <svg 
          className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-100 text-accent' : 'opacity-0'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </span>

      {/* Sliding Knob */}
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${
          isDark ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
