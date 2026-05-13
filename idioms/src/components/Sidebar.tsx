import { useState } from 'react';
import { Link } from "react-router-dom";

export function Sidebar() {
  const [isActive, setIsActive] = useState(false);

  const toggleSidebar = () => {
    setIsActive(!isActive);
  };

  return (
    <div>
      <div
        className="mt-[70px] bg-[#111] text-white text-center p-[10px] cursor-pointer min-[1700px]:hidden"
        onClick={toggleSidebar}
      >
        ☰ Menu
      </div>
      <div className={[
        "bg-[var(--primary-color)] overflow-x-hidden",
        "max-[1699px]:w-full max-[1699px]:h-auto max-[1699px]:relative",
        "min-[1700px]:w-[200px] min-[1700px]:fixed min-[1700px]:top-0 min-[1700px]:left-0 min-[1700px]:h-full min-[1700px]:pt-[70px]",
      ].join(' ')}>
        <ul className={[
          "list-none p-0",
          !isActive ? "max-[1699px]:hidden" : "",
        ].join(' ')}>
          <li className="p-2 text-center">
            <Link to="/idioms" className="text-white no-underline block hover:bg-[var(--accent-color)]">Idioms</Link>
          </li>
          <li className="p-2 text-center">
            <Link to="/cards" className="text-white no-underline block hover:bg-[var(--accent-color)]">Flashcards</Link>
          </li>
          <li className="p-2 text-center">
            <Link to="/new-idiom" className="text-white no-underline block hover:bg-[var(--accent-color)]">Submit Idiom</Link>
          </li>
          <li className="p-2 text-center">
            <Link to="/my-idioms" className="text-white no-underline block hover:bg-[var(--accent-color)]">My Idioms</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
