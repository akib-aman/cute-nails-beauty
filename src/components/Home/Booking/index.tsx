"use client";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isSunday, setHours, setMinutes, isSameDay, isAfter, isBefore } from "date-fns";
import {
  TreatmentSections,
  TreatmentSection,
  Treatment,
  ChildTreatment,
} from "@/app/api/data";
import { load } from 'recaptcha-v3';


const Booking = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [selectedTreatments, setSelectedTreatments] = useState<{ name: string; price: number }[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ start: Date; end: Date }[]>([]);
  const [recaptchaPassed, setRecaptchaPassed] = useState(false);

  // Fetch existing bookings on mount
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data: { start: string; end: string }[] = await res.json();
        setBookedSlots(
          data.map((b) => ({
            start: new Date(b.start),
            end: new Date(b.end),
          }))
        );
      }
    })();
  }, []);

  const toggleTreatment = (name: string, price: number, checked: boolean) => {
    if (checked) {
      setSelectedTreatments((prev) => [...prev, { name, price }]);
    } else {
      setSelectedTreatments((prev) => prev.filter((t) => t.name !== name));
    }
  };

  const totalPrice = selectedTreatments.reduce((sum, t) => sum + t.price, 0);

  const next = async () => {


    if (step === 0 && (!name.trim() || !email.trim())) {
      return alert("Please enter both name and email");
    }
    if (step === 1 && selectedTreatments.length === 0) {
      return alert("Please select at least one treatment");
    }
    {step < 3 && (
      <button
        onClick={next}
        className={`px-4 py-2 rounded-lg ${
          (step === 2 && (!date || email.trim() === '')) 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-primary text-white hover:bg-pink-600'
        }`}
        disabled={step === 2 && (!date || email.trim() === '')}
      >
        Next
      </button>
    )}
    // If going to step 3, run reCAPTCHA
    if (step === 2) {
      try {
        const recaptcha = await load(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!);
        const token = await recaptcha.execute("book_appointment");
        const res = await fetch("/api/recaptcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!data.success) {
          alert("reCAPTCHA failed. Please try again.");
          return;
        }
        setRecaptchaPassed(true);
      } catch (err) {
        console.error("reCAPTCHA error:", err);
        alert("Could not verify reCAPTCHA.");
        return;
      }
    }   
    setStep((s) => Math.min(s + 1, 3));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, date, treatments: selectedTreatments, total: totalPrice }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Booking confirmed!");
    } else {
      alert(data.message);
    }
  };

  // When a date is selected, filter out times that conflict with existing bookings on that day
  const filterAvailableTimes = (time: Date) => {
    if (!date) return true; // no need to filter before a date is chosen

    // We only filter if `time` is on the same day as `date`
    // But DatePicker calls filterTime with a Date whose date matches date’s date
    // So just check overlapping
    return !bookedSlots.some((slot) =>
      isSameDay(slot.start, date) &&
      isBefore(time, slot.end) &&
      isAfter(time, new Date(slot.start.getTime() - 1))
    );
  };

  const excludedTimes = Array.from({ length: 13 }, (_, i) =>
    setHours(setMinutes(new Date(), 0), i)
  );

  return (
    <section className="bg-gray-50" id="bookings-section">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md">
        <div className="text-center">
          <p className="text-primary text-lg font-normal mb-3 tracking-widest uppercase">
            Book Appointment
          </p>
          <h2 className="text-3xl lg:text-5xl font-semibold text-black">
            No Booking Fees!
          </h2>
        </div>

        <div className="mx-auto mt-12 p-10 shadow rounded-xl text-black max-w-xl">
          {step === 0 && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border p-2 rounded bg-gray-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border p-2 rounded bg-gray-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Select Treatments</h2>
              {TreatmentSections.map((section: TreatmentSection) => (
                <div key={section.title} className="mb-4">
                  <h4 className="font-medium">{section.title}</h4>
                  <div className="pl-4">
                    {section.treatments.map((treat: Treatment) => {
                      if (treat.children) {
                        return (
                          <div key={treat.name} className="mb-2">
                            <p className="font-semibold">{treat.name}:</p>
                            <div className="pl-4">
                              {treat.children.map((child: ChildTreatment) => {
                                const priceNum = parseFloat(
                                  child.price.replace(/[^0-9.]/g, "")
                                );
                                const isChecked = selectedTreatments.some(
                                  (t) => t.name === child.name
                                );
                                return (
                                  <label
                                    key={child.name}
                                    className="flex items-center space-x-3 mb-1"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) =>
                                        toggleTreatment(
                                          child.name,
                                          priceNum,
                                          e.target.checked
                                        )
                                      }
                                      className="
                                        form-checkbox h-4 w-4 text-pink-500
                                        border-gray-300 rounded focus:ring-pink-400
                                      "
                                    />
                                    <span className="flex-1 text-gray-800">
                                      {child.name}
                                    </span>
                                    <span className="text-gray-600">
                                      {child.price}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      if (treat.price) {
                        const priceNum = parseFloat(
                          treat.price.replace(/[^0-9.]/g, "")
                        );
                        const isChecked = selectedTreatments.some(
                          (t) => t.name === treat.name
                        );
                        return (
                          <label
                            key={treat.name}
                            className="flex items-center justify-between mb-2 space-x-3"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  toggleTreatment(
                                    treat.name,
                                    priceNum,
                                    e.target.checked
                                  )
                                }
                                className="
                                  form-checkbox h-4 w-4 text-pink-500
                                  border-gray-300 rounded focus:ring-pink-400
                                "
                              />
                              <span className="text-gray-800">{treat.name}</span>
                            </div>
                            <span className="text-gray-600">{treat.price}</span>
                          </label>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}

              <div className="text-right font-semibold">
                Total: £{totalPrice.toFixed(2)}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              {email.trim() === '' ? (
                <p className="text-red-600 font-medium">
                  Please enter your email first to see available slots.
                </p>
              ) : (
                <DatePicker
                  selected={date}
                  onChange={(d) => setDate(d)}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  filterDate={(d) => !isSunday(d)}
                  filterTime={filterAvailableTimes}
                  placeholderText="Pick a Date & Time!"
                  minTime={setHours(setMinutes(new Date(), 0), 11)}
                  maxTime={setHours(setMinutes(new Date(), 0), 17)}
                  className="w-full border p-2 rounded bg-gray-50"
                  required
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 text-center">
              <p>
                <strong>Name:</strong> {name}
              </p>
              <p>
                <strong>Email:</strong> {email}
              </p>
              <p>
                <strong>Time:</strong> {date?.toLocaleString()}
              </p>
              <p>
                <strong>Treatments:</strong>
              </p>
              <ul className="list-disc list-inside">
                {selectedTreatments.map((t, i) => (
                  <li key={i}>
                    {t.name} - £{t.price.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="font-semibold">Total: £{totalPrice.toFixed(2)}</p>
              <button
                onClick={handleSubmit}
                disabled={!recaptchaPassed}
                className={`bg-primary text-white font-semibold py-2 px-6 rounded-lg mt-4 transition ${
                  recaptchaPassed ? 'hover:bg-pink-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                Book!
              </button>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 0 && (
              <button
                onClick={prev}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg"
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                onClick={next}
                className="bg-primary text-white px-4 py-2 rounded-lg"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;
