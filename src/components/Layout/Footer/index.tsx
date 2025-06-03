import React, { FC } from "react";
import Link from "next/link";
import { headerData } from "../Header/Navigation/menuData";
import { Icon } from "@iconify/react";
import Logo from "../Header/Logo";

const Footer: FC = () => {
  return (
    <footer className="pt-16 bg-darkmode">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:gap-20 md:gap-6 sm:gap-12 gap-6  pb-16">
          <div className="col-span-2">
            <Logo />
            <p className="text-xs font-medium text-grey text-white/50 mt-5 mb-16 max-w-70%">
              Cute is a beauty salon situated in Edinburgh that specializes in Eyebrow threading, waxing, nails and lashes.
            </p>

            <div className="flex gap-6 items-center">
              <Link href="https://www.facebook.com/cuteedinburgh/?locale=en_GB" className="group bg-white hover:bg-primary rounded-full shadow-xl p-3">
                <Icon
                  icon="fa6-brands:facebook-f"
                  width="16"
                  height="16"
                  className=" group-hover:text-white text-black"
                />
              </Link>
              <Link href="https://www.instagram.com/cute.edinburgh" className="group bg-white hover:bg-primary rounded-full shadow-xl p-3">
                <Icon
                  icon="fa6-brands:instagram"
                  width="16"
                  height="16"
                  className=" group-hover:text-white text-black"
                />
              </Link>
            </div>
          </div>
          <div className="">
            <h4 className=" text-white mb-9 font-semibold text-xl">More</h4>
            <ul>
              {headerData.map((item, index) => (
                <li key={index} className="pb-4">
                  <Link
                    href={item.href}
                    className="text-white/70 hover:text-white text-base"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t  border-white/15 py-10 flex justify-between items-center">
          <p className="text-sm text-white/70">
            @2025 Cute  All rights reserved.
          </p>

          <div className="">
            <Link href="/privacy-policy" className="text-sm text-white/70 hover:text-white">Privacy policy</Link>
            <Link href="/terms-and-conditions" className="text-sm px-5 text-white/70 hover:text-white">Terms & conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
