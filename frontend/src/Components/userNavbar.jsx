import { BsMailbox } from "react-icons/bs";
import { MdDashboard, MdPerson } from "react-icons/md";
import Sidebar from "./Sidebar";

const USER_LINKS = [
  { to: "/dashboard", icon: <MdDashboard className="w-6 h-6" />, label: "Dashboard" },
  { to: "/profile", icon: <MdPerson className="w-6 h-6" />, label: "Profile" },
  { to: "/mailbox", icon: <BsMailbox className="w-6 h-6" />, label: "Mailbox" },
];

export default function UserNavbar({ onLogout } = {}) {
  return <Sidebar navLinks={USER_LINKS} settingsPath="/userSettings" onLogout={onLogout} />;
}
