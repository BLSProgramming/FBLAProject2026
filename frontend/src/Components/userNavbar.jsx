import { MdDashboard, MdSettings } from "react-icons/md";
import Sidebar from "./Sidebar";

const USER_LINKS = [
  { to: "/dashboard", icon: <MdDashboard className="w-6 h-6" />, label: "Dashboard" },
  { to: "/userSettings", icon: <MdSettings className="w-6 h-6" />, label: "Settings" },
];

export default function UserNavbar({ onLogout } = {}) {
  return <Sidebar navLinks={USER_LINKS} settingsPath="/userSettings" onLogout={onLogout} />;
}
