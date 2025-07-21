import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('userId');
    return name && id ? { name, id } : null;
  });

  const login = (id, name) => {
    setUser({ id, name });
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 