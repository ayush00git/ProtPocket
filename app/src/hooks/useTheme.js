import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Initializer
    const savedTheme = localStorage.getItem('ProtPocket-theme');
    return savedTheme ? savedTheme : 'light';
  });

  useEffect(() => {
    // Persist and apply
    localStorage.setItem('ProtPocket-theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}
