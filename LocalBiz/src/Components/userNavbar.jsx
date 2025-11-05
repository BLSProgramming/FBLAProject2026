import { FaForumbee } from "react-icons/fa";
import { Link } from "react-router-dom";
import { BsMailbox } from "react-icons/bs";
import { MdDashboard, MdPerson, MdClose, MdMenu } from "react-icons/md";
import NavbarFooter from "./NavbarFooter";
import { useNavbar } from "../contexts/NavbarContext";

export default function UserNavbar({ onLogout } = {}) {
  const { isNavbarOpen: isOpen, setIsNavbarOpen: setIsOpen } = useNavbar();

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 z-[10000] w-10 h-10 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 ${isOpen ? 'left-[272px]' : 'left-4'}`}
        title={isOpen ? "Close Menu" : "Open Menu"}
      >
        {isOpen ? <MdClose className="w-5 h-5" /> : <MdMenu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#050505] text-yellow-200 flex flex-col justify-between z-[9999] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-6 py-8">
          <FaForumbee className="w-10 h-10 text-yellow-400" />
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

      <NavbarFooter onLogout={onLogout} settingsPath="/userSettings" />
    </aside>
    </>
  );
}
