import { createContext, useContext, useState } from 'react';

const NavbarContext = createContext();

export function NavbarProvider({ children }) {
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);

  return (
    <NavbarContext.Provider value={{ isNavbarOpen, setIsNavbarOpen }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
}