import { Outlet } from "react-router-dom";
import BusinessNavbar from "./Components/BusinessNavbar";
import UserNavbar from "./Components/UserNavbar";
import { NavbarProvider, useNavbar } from "./contexts/NavbarContext";

function LayoutContent() {
  const userType = typeof window !== "undefined" ? localStorage.getItem("userType") : null;
  const isBusiness = userType === "business";
  const isUser = userType === "user";
  const hasNavbar = isBusiness || isUser;
  const { isNavbarOpen } = useNavbar();

  return (
    <>
      {isBusiness && <BusinessNavbar />}
      {isUser && <UserNavbar />}
      <main className={`transition-all duration-500 ease-in-out ${
        hasNavbar && isNavbarOpen 
          ? 'ml-64 w-[calc(100vw-16rem)]' // Constrain width when navbar open (100vw - 256px)
          : 'ml-0 w-full' // Full width when navbar closed
      }`}>
        <Outlet />
      </main>
    </>
  );
}

export function Layout() {
  return (
    <NavbarProvider>
      <LayoutContent />
    </NavbarProvider>
  );
}