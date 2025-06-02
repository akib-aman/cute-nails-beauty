import React from "react";
import Hero from "@/components/Home/Hero";
import Treatments from "@/components/Home/Treatments";
import Cook from "@/components/Home/Cook";
import Booking from "@/components/Home/Booking";
import Gallery from "@/components/Home/Gallery";
// import Newsletter from "@/components/Home/Newsletter";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Cute Nails & Beauty",
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Treatments />
      <Booking />
      <Gallery />
    </main>
  );
}
