import React, { createContext, useContext, ReactNode } from 'react';

type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: {
    start: string;
    end: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  card: {
    background: string;
    border: string;
  };
};

const kidsTheme: ThemeColors = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFD166',
  background: {
    start: '#FFE5E5',
    end: '#FFF5F5',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
  },
  card: {
    background: '#FFFFFF',
    border: '#FF6B6B',
  },
};

const ThemeContext = createContext<ThemeColors>(kidsTheme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeContext.Provider value={kidsTheme}>
      {children}
    </ThemeContext.Provider>
  );
};
