import React, { createContext, useContext, useState, useEffect } from 'react';

const UsernameContext = createContext();

export const useUsername = () => {
  return useContext(UsernameContext);
};

export const UsernameProvider = ({ children }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');

  useEffect(() => {
    localStorage.setItem('username', username);
  }, [username]);

  return (
    <UsernameContext.Provider value={{ username, setUsername }}>
      {children}
    </UsernameContext.Provider>
  );
};