import { FaForumbee } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { BsMailbox } from "react-icons/bs";
import { MdDashboard, MdPerson } from "react-icons/md";



export default function UserNavbar({ onLogout } = {}) {
  function handleLogout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      localStorage.removeItem("userId");
    } catch {}
    if (typeof onLogout === "function") onLogout();
  }

  return (
  <aside className="fixed left-0 top-0 h-full w-64 bg-[#050505] text-yellow-200 flex flex-col justify-between z-[9999]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-6 py-12">
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
              <Link to="/profile" className="flex items-center h-full px-6 text-xl font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">
                <MdPerson className="mr-3 w-6 h-6 text-yellow-200" />
                Profile
              </Link>
            </li>
            <li className="flex-1">
              <Link to="/mailbox" className="flex items-center h-full px-6 text-xl font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">
                <BsMailbox className="mr-3 w-6 h-6 text-yellow-200" />
                Mailbox
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="px-3 pb-4">
        <div className="border-t border-yellow-800 mb-3" />
        <div className="pt-1">
          <Link to="/userSettings" className="flex items-center gap-2 px-4 py-1 rounded-md hover:bg-yellow-400 hover:text-black transition text-sm">
            <FaGear className="w-4 h-4 text-yellow-200" />
            Settings
          </Link>

          <Link onClick={handleLogout} to="/login" className="mt-2 w-full text-left flex items-center gap-2 px-4 py-1 rounded-md hover:bg-yellow-400 hover:text-black transition text-sm">
            <svg className="w-4 h-4 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
}
