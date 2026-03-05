import { Link } from "react-router-dom";
import { MdClose, MdMenu } from "react-icons/md";
import { FaForumbee } from "react-icons/fa";
import NavbarFooter from "./NavbarFooter";
import { useNavbar } from "../contexts/NavbarContext";

/**
 * Shared sidebar shell used by both BusinessNavbar and UserNavbar.
 *
 * Props:
 *  - navLinks: [{ to, icon: ReactElement, label }]
 *  - settingsPath: string (forwarded to NavbarFooter)
 *  - onLogout: optional callback
 */
export default function Sidebar({ navLinks = [], settingsPath = "/settings", onLogout }) {
  const { isNavbarOpen: isOpen, setIsNavbarOpen: setIsOpen } = useNavbar();

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#050505] text-yellow-200 flex flex-col justify-between z-[9999] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex-1 flex flex-col">
          {/* Header with inline toggle */}
          <div className="flex items-center justify-between px-5 py-6">
            <div className="flex items-center gap-2.5">
              <FaForumbee className="w-8 h-8 text-yellow-400" />
              <div>
                <h2 className="text-xl font-extrabold text-yellow-400 leading-tight">Biz-Buzz</h2>
                <p className="text-[10px] text-yellow-300">Local Business Hub</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-md bg-yellow-400/10 hover:bg-yellow-400 text-yellow-400 hover:text-black flex items-center justify-center transition-colors duration-200"
              title="Close Menu"
            >
              <MdClose className="w-4.5 h-4.5" />
            </button>
          </div>

          <nav className="mt-6 px-4 flex-1">
            <ul className="flex flex-col justify-center gap-3 h-full">
              {navLinks.map(({ to, icon, label }) => (
                <li key={to} className="flex-1">
                  <Link
                    to={to}
                    className="flex items-center h-full px-6 text-xl font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition"
                  >
                    <span className="mr-3 w-6 h-6 text-yellow-200">{icon}</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <NavbarFooter onLogout={onLogout} settingsPath={settingsPath} />
      </aside>

      {/* Compact open button — always rendered, animated in/out */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-5 z-[10000] w-9 h-9 bg-yellow-400 hover:bg-yellow-500 text-black rounded-md flex items-center justify-center shadow-md transition-all duration-300 ease-in-out hover:scale-105 ${
          isOpen
            ? 'left-[17rem] opacity-0 pointer-events-none scale-75'
            : 'left-3 opacity-100 pointer-events-auto scale-100'
        }`}
        title="Open Menu"
      >
        <MdMenu className="w-5 h-5" />
      </button>
    </>
  );
}
