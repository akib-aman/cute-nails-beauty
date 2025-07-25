import { useState } from "react";
import Link from "next/link";
import { HeaderItem } from "./menu";

const MobileHeaderLink: React.FC<{ item: HeaderItem; closeMenu: () => void }> = ({ item, closeMenu }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);

  const handleToggle = () => {
    setSubmenuOpen(!submenuOpen);
  };

  return (
    <div className="relative w-full">
      <Link href={item.href} legacyBehavior>
        <a
          onClick={(e) => {
            if (item.submenu) {
              e.preventDefault();
              handleToggle();
            } else {
              closeMenu();
            }
          }}
          className="flex items-center justify-between w-full py-2 text-muted focus:outline-none"
        >
          {item.label}
          {item.submenu && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.5em"
              height="1.5em"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m7 10l5 5l5-5"
              />
            </svg>
          )}
        </a>
      </Link>

      {submenuOpen && item.submenu && (
        <div className="bg-white p-2 w-full">
          {item.submenu.map((subItem, index) => (
            <Link
              key={index}
              href={subItem.href}
              onClick={closeMenu}
              className="block py-2 text-gray-500 hover:bg-gray-200"
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileHeaderLink;
