"use client";
import { useRef, useState, useEffect } from "react";
import { headerData } from "../Header/Navigation/menuData";
import PreLoader from "@/components/Common/PreLoader";
import Logo from "./Logo";
import HeaderLink from "../Header/Navigation/HeaderLink";
import MobileHeaderLink from "../Header/Navigation/MobileHeaderLink";

const Header: React.FC = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Handle preloader
    const timer = setTimeout(() => {
      setFadeOut(true); // start fade
      setTimeout(() => setLoading(false), 500); // hide after fade
    }, 2000);

    // Handle scroll-based sticky header (only on mobile)
    const handleScroll = () => {
      if (window.innerWidth <= 768) {
        setSticky(window.scrollY > 20); // apply shrink when scrolled down a bit
      } else {
        setSticky(false); // don't shrink on desktop
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup both timer and scroll event
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
    <header
      className={`fixed top-0 z-40 w-full bg-primary transition-all duration-300 ${sticky ? " shadow-lg bg-primary py-4" : "shadow-none py-8"
        }`}
    >
      <div className="lg:py-0 py-2">
        <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md flex items-center justify-between px-4">
          <Logo />
          <nav className="hidden lg:flex flex-grow items-center gap-32 justify-end">
            {headerData.map((item, index) => (
              <HeaderLink key={index} item={item} />
            ))}
          </nav>
          <div className="flex items-center gap-4">

            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="block lg:hidden p-2 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white mt-1.5"></span>
              <span className="block w-6 h-0.5 bg-white mt-1.5"></span>
            </button>
          </div>
        </div>
        {navbarOpen && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-40" />
        )}
        <div
          ref={mobileMenuRef}
          className={`lg:hidden fixed top-0 right-0 h-full w-full bg-darkmode shadow-lg transform transition-transform duration-300 max-w-xs ${navbarOpen ? "translate-x-0" : "translate-x-full"
            } z-50`}
        >
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-bold text-midnight_text ">
              <Logo />
            </h2>

            {/*  */}
            <button
              onClick={() => setNavbarOpen(false)}
              className="bg-[url('/images/closed.svg')] bg-no-repeat bg-contain w-6 h-6 absolute top-0 right-0 mr-5 mt-5"
              aria-label="Close menu Modal"
            ></button>
          </div>
          <nav className="flex flex-col items-start p-4">
            {headerData.map((item, index) => (
              <MobileHeaderLink key={index} item={item} closeMenu={() => setNavbarOpen(false)} />
            ))}
            <div className="mt-4 flex flex-col space-y-4 w-full">
            </div>
          </nav>
        </div>
      </div>
    </header>

    {/* PRELOADER OVERLAY */}
      {loading && (
        <div
          className={`fixed inset-0 z-50 bg-white flex items-center justify-center transition-opacity duration-500 ${
            fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <PreLoader />
        </div>
      )}
    </>
  );
};

export default Header;