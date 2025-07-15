import React from "react";
import Hero from "@/components/Home/Hero";
import Treatments from "@/components/Home/Treatments";
import Contact from "@/components/Home/Contact";
import Booking from "@/components/Home/Booking";
import Gallery from "@/components/Home/Gallery";

export default function Home() {
  return (
    
    <main>
      <meta name="robots" content="index, follow" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BeautySalon",
          "name": "Cute Threading Nails & Beauty",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "32 Duart Crescent",
            "addressLocality": "Clermiston",
            "addressRegion": "Edinburgh",
            "postalCode": "EH4 7JP",
            "addressCountry": "GB"
          },
          "telephone": "+44 0795 6044 691",
          "url": "https://cute-nails-beauty.vercel.app/",
          "openingHours": [
            "Mo-We 09:30-17:30",
            "Th-Fr 09:30-18:30",
            "Sa 09:30-17:30",
            "Su 11:00-16:00"
          ],
          "priceRange": "£",
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 55.9571,
            "longitude": -3.2750
          },
          "sameAs": [
            "https://www.facebook.com/cuteedinburgh/?locale=en_GB",
            "https://www.instagram.com/cute.edinburgh"
          ]
        })
      }} />

      <Hero />
      <Treatments />
      <Booking />
      <Gallery />
      <Contact />
    </main>
  );
}
