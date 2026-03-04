import { BsMailbox } from "react-icons/bs";
import { MdBusinessCenter, MdDashboard } from "react-icons/md";
import { SiSimpleanalytics } from "react-icons/si";
import Sidebar from "./Sidebar";

const BUSINESS_LINKS = [
	{ to: "/dashboard", icon: <MdDashboard className="w-6 h-6" />, label: "Dashboard" },
	{ to: "/manageBusiness", icon: <MdBusinessCenter className="w-6 h-6" />, label: "Manage Business" },
	{ to: "/mailbox", icon: <BsMailbox className="w-6 h-6" />, label: "Mailbox" },
	{ to: "/analytics", icon: <SiSimpleanalytics className="w-6 h-6" />, label: "Analytics" },
];

export default function BusinessNavbar({ onLogout } = {}) {
	return <Sidebar navLinks={BUSINESS_LINKS} settingsPath="/settings" onLogout={onLogout} />;
}

