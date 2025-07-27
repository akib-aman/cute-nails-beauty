'use client';

import Link from "next/link";
import { Icon } from "@iconify/react";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Appointment = {
  id: string;
  email: string;
  start: string;
  treatments: { name: string; price: number }[];
  total: number;
  displayStart?: string; // Add this type for the formatted date from API
};

// Add this formatting function at the top of your component file
const formatUKDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export default function CancelAppointmentClient() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const bookingId = params.get('booking_id');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const url = bookingId
        ? `/api/appointments?id=${bookingId}`
        : sessionId
        ? `/api/checkout_sessions?session_id=${sessionId}`
        : null;

      if (!url) return;

      const res = await fetch(url);
      if (!res.ok) return console.error(await res.text());

      const data = await res.json();

      setAppointment({
        ...data,
        treatments: Array.isArray(data.treatments)
          ? data.treatments
          : JSON.parse(data.treatments)
      });
    };

    fetchData();
  }, [bookingId, sessionId]);

  const handleCancel = async () => {
    if (!bookingId) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/cancelbooking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });

      if (!res.ok) {
        setError('Failed to cancel appointment.');
        return;
      }

      setCancelled(true);
    } catch (err) {
      console.error(err);
      setError('Unexpected error. Try again later.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <section className="bg-gray-50 py-16 mt-24 text-black">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-black">
            {cancelled ? "Booking Cancelled" : "Cancel Appointment"}
          </h2>
        </div>

        {!cancelled && appointment && (
          <>
            <div className="space-y-4 text-lg">
              <p><strong>Email:</strong> {appointment.email}</p>
              {/* Use the formatUKDateTime function here */}
              <p><strong>Time:</strong> {appointment.displayStart || formatUKDateTime(appointment.start)}</p>
              <div>
                <p className="font-semibold">Treatments:</p>
                <ul className="list-disc list-inside">
                  {appointment.treatments.map((t, i) => (
                    <li key={i}>{t.name} – £{t.price.toFixed(2)}</li>
                  ))}
                </ul>
              </div>
              <p className="font-bold">Total: £{appointment.total.toFixed(2)}</p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xl mb-4 font-semibold text-red-600">
                Are you sure you want to cancel this appointment?
              </p>

              {error && <p className="text-red-500">{error}</p>}

              <button
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-xl shadow-lg disabled:opacity-60"
                disabled={confirming}
              >
                {confirming ? "Cancelling…" : "Yes, Cancel Appointment"}
              </button>
            </div>
          </>
        )}

        {cancelled && (
          <div className="text-center mt-8">
            <p className="text-lg text-gray-700 mb-6">
              Booking has been successfully cancelled and refunded to the customer.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}