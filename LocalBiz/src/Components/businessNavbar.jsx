import { Link } from "react-router-dom";
import { BsMailbox } from "react-icons/bs";
import { MdBusinessCenter, MdDashboard } from "react-icons/md";
import { SiSimpleanalytics } from "react-icons/si";
import { FaForumbee } from "react-icons/fa";
import NavbarFooter from "./sub-components/NavbarFooter";

export default function BusinessNavbar({ onLogout } = {}) {

	return (
		<aside className="fixed left-0 top-0 h-full w-64 bg-[#050505] text-yellow-200 flex flex-col justify-between z-[9999]">
			<div className="flex-1 flex flex-col">
				<div className="flex items-center gap-3 px-6 py-8">
					<FaForumbee className="w-10 h-10 text-yellow-200" />
					<div>
						<h2 className="text-2xl font-extrabold text-yellow-400">Biz-Buzz</h2>
						<p className="text-xs text-yellow-300">Local Business Hub</p>
					</div>
				</div>

				<nav className="mt-6 px-4 flex-1">
					<ul className="flex flex-col justify-center gap-3 h-full">
						<li className="flex-1">
							<Link to="/dashboard" className="flex items-center h-full px-6 text-xl font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">
								<MdDashboard className="mr-3 w-6 h-6 text-yellow-200" />
								Dashboard
							</Link>
						</li>
						<li className="flex-1">
							<Link to="/manageBusiness" className="flex items-center h-full px-6 text-xl font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">
								<MdBusinessCenter className="mr-3 w-6 h-6 text-yellow-200" />
								Manage Business
							</Link>
						</li>
						<li className="flex-1">
							<Link to="/mailbox" className="flex items-center h-full px-6 text-xl font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">
								<BsMailbox className="mr-3 w-6 h-6 text-yellow-200" />
								Mailbox
							</Link>
						</li>
						<li className="flex-1">
							<Link to="/analytics" className="flex items-center h-full px-6 text-xl font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">
								<SiSimpleanalytics className="mr-3 w-6 h-6 text-yellow-200" />
								Analytics
							</Link>
						</li>
					</ul>
				</nav>
			</div>

				<NavbarFooter onLogout={onLogout} settingsPath="/settings" />
		</aside>
	);
}

