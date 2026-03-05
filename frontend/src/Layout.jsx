import { Outlet } from "react-router-dom";
import BusinessNavbar from "./Components/businessNavbar";
import UserNavbar from "./Components/userNavbar";
import { NavbarProvider, useNavbar } from "./contexts/NavbarContext";
import { useAuth } from "./contexts/AuthContext";

function LayoutContent() {
  const { user } = useAuth();
  const userType = user?.userType ?? null;
  const isBusiness = userType === "business";
  const isUser = userType === "user";
  const hasNavbar = isBusiness || isUser;
  const { isNavbarOpen } = useNavbar();

  return (
    <>
      {isBusiness && <BusinessNavbar />}
      {isUser && <UserNavbar />}
      <main className={`transition-all duration-300 ease-in-out ${
        hasNavbar && isNavbarOpen 
          ? 'ml-64 w-[calc(100vw-16rem)]' // Push content to the right when navbar open
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