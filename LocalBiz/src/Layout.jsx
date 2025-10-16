import { Outlet } from "react-router-dom";
import BusinessNavbar from "./Components/businessNavbar";
import UserNavbar from "./Components/userNavbar";

export function Layout() {
  const userType = typeof window !== "undefined" ? localStorage.getItem("userType") : null;
  const isBusiness = userType === "business";
  const isUser = userType === "user";
  const hasNavbar = isBusiness || isUser;

  return (
    <>
      {isBusiness && <BusinessNavbar />}
      {isUser && <UserNavbar />}
      <main className={hasNavbar ? "ml-64" : ""}>
        <Outlet />
      </main>
    </>
  );
}