import React from "react";
import Hero from "@/components/Home/Hero";
import Treatments from "@/components/Home/Treatments";
import Contact from "@/components/Home/Contact";
import Booking from "@/components/Home/Booking";
import Gallery from "@/components/Home/Gallery";
// import Newsletter from "@/components/Home/Newsletter";

export default function Home() {
  return (
    <main>
      <Hero />
      <Treatments />
      <Booking />
      <Gallery />
      <Contact />
    </main>
  );
}
