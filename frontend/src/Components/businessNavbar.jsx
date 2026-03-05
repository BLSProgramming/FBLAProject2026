import { MdBusinessCenter, MdDashboard } from "react-icons/md";
import { MdReviews } from "react-icons/md";
import { MdLocalOffer } from "react-icons/md";
import Sidebar from "./Sidebar";

const BUSINESS_LINKS = [
	{ to: "/dashboard", icon: <MdDashboard className="w-6 h-6" />, label: "Dashboard" },
	{ to: "/manageBusiness", icon: <MdBusinessCenter className="w-6 h-6" />, label: "Manage Business" },
	{ to: "/manageOffers", icon: <MdLocalOffer className="w-6 h-6" />, label: "Manage Offers" },
	{ to: "/manageReviews", icon: <MdReviews className="w-6 h-6" />, label: "Manage Reviews" },
];

export default function BusinessNavbar({ onLogout } = {}) {
	return <Sidebar navLinks={BUSINESS_LINKS} settingsPath="/settings" onLogout={onLogout} />;
}

