import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const lightTheme = {
  background: '#F3E9EC',
  cardBackground: '#fff',
  text: '#333',
  textSecondary: '#666',
  textTertiary: '#999',
  border: '#f0f0f0',
  inputBackground: '#f9f9f9',
  primary: '#F70776',
  primaryLight: '#FF88C5',
  secondary: '#03C8F0',
  neutral: '#F3E9EC',
  shadow: '#000',
};

export const darkTheme = {
  background: '#130B1A',
  cardBackground: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textTertiary: '#808080',
  border: '#2C2C2C',
  inputBackground: '#2C2C2C',
  primary: '#F70776',
  primaryLight: '#FF88C5',
  secondary: '#03C8F0',
  neutral: '#F3E9EC',
  shadow: '#000',
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
