export const dynamic = 'force-dynamic';   // request‑time render (avoids SSG)

import { Suspense } from 'react';

/* ------------------------------------------------------------------ */
/*  1)  SERVER component: the real page exported by Next.js            */
/* ------------------------------------------------------------------ */
export default function SuccessPage() {
  return (
    <Suspense fallback={<p className="text-center mt-24">Loading…</p>}>
      <SuccessClient />
    </Suspense>
  );
}

'use client';
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
type Appointment = {
  id: string;
  email: string;
  start: string;                 // ISO string from Prisma
  treatments: { name: string; price: number }[];
  total: number;
};

function SuccessClient() {
  const params = useSearchParams();
  const sessionId  = params.get('session_id');
  const bookingId  = params.get('booking_id');
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (bookingId)       url = `/api/appointments?id=${bookingId}`;
    else if (sessionId)  url = `/api/checkout_sessions?session_id=${sessionId}`;
    if (!url) return;

    (async () => {
      const res  = await fetch(url);
      if (!res.ok) { console.error(await res.text()); return; }
      const data = await res.json();
      // treatments is stored as Prisma Json → parse it so we can map() later
      setAppointment({
        ...data,
        treatments: Array.isArray(data.treatments) ? data.treatments
                                                   : JSON.parse(data.treatments)
      });
    })();
  }, [bookingId, sessionId]);

  return (
      <section className="bg-gray-50 py-16 mt-24 text-black" id="contact-section">
          <div className="container mx-auto px-4 lg:max-w-screen-xl md:max-w-screen-md">
              
              {/* Header */}
              <div className="text-center mb-10">
                  <p className="text-primary text-lg tracking-widest uppercase mb-2">
                      Success!
                  </p>
                  <h2 className="text-black font-bold text-4xl">Appointment Booked!</h2>
              </div>

              <section>
                <div className="container mx-auto px-4">
                  {appointment ? (
                    <>
                      <p><strong>Email:</strong> {appointment.email}</p>
                      <p><strong>Time:</strong> {new Date(appointment.start).toLocaleString()}</p>

                      <p className="mt-4 font-semibold">Treatments:</p>
                      <ul className="list-disc list-inside">
                        {appointment.treatments.map((t, i) => (
                          <li key={i}>{t.name} – £{t.price.toFixed(2)}</li>
                        ))}
                      </ul>

                      <p className="mt-2 font-bold">Total paid: £{appointment.total.toFixed(2)}</p>
                    </>
                  ) : (
                    <p>Loading appointment details…</p>
                  )}
                </div>
              </section>

              {/* Flex container: Map and Info side by side */}
              <div className="flex flex-col lg:flex-row gap-16 items-start">
                  
                  {/* Map */}
                  <div className="w-full lg:w-1/2 h-[32rem] rounded-lg overflow-hidden shadow-md">
                      <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2233.7664432839097!2d-3.2990073874977046!3d55.95341987640911!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4887c542336ab831%3A0xcea2e0e5af61e587!2sCute%20Threading%20Nails%20and%20Beauty!5e0!3m2!1sen!2suk!4v1749650880080!5m2!1sen!2suk"
                          width="100%"
                          height="100%"
                          className="border-0"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                  </div>

                  {/* Contact Info */}
                  <div className="w-full lg:w-1/2 space-y-10">
                      <div>
                          <h3 className="text-black font-semibold text-3xl mb-4">Contact Details</h3>
                          <p className="text-lg text-gray-700">
                              Phone:{' '}
                              <a href="tel:07956044691" className="text-primary hover:underline">
                                  0795 6044 691
                              </a>
                          </p>
                      </div>

                      <div>
                          <h3 className="text-black font-semibold text-3xl mb-4">Opening Hours</h3>
                          <ul className="text-lg text-gray-700 space-y-2">
                              <li>Monday – Friday: 10:00 AM – 5:30 PM</li>
                              <li>Saturday: 10:00 AM – 6:30 PM</li>
                              <li>Sunday: Closed</li>
                          </ul>
                          <p className="text-sm text-gray-500 mt-4">
                              *Opening hours are subject to change. Please check Google for the latest updates.
                          </p>
                      </div>

                      <div className="flex flex-col items-start">
                          <h3 className="text-black font-semibold text-3xl mb-4">Social Links</h3>

                          <div className="flex gap-6">
                              <Link href="https://www.facebook.com/cuteedinburgh/?locale=en_GB" className="group bg-white hover:bg-primary rounded-full shadow-xl p-3">
                              <Icon
                                  icon="fa6-brands:facebook-f"
                                  width="16"
                                  height="16"
                                  className="group-hover:text-white text-black"
                              />
                              </Link>
                              <Link href="https://www.instagram.com/cute.edinburgh" className="group bg-white hover:bg-primary rounded-full shadow-xl p-3">
                              <Icon
                                  icon="fa6-brands:instagram"
                                  width="16"
                                  height="16"
                                  className="group-hover:text-white text-black"
                              />
                              </Link>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      </section>
  );
};
