"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isSunday, setHours, setMinutes, isSameDay, isAfter, isBefore, addMinutes } from "date-fns";
import {
  TreatmentSections,
} from "@/app/api/data";
import { load } from 'recaptcha-v3';
import { Paintbrush, Sparkles, Scissors, Eye } from "lucide-react";

const sectionIcons: Record<string, JSX.Element> = {
  "Vinylux Nail Treatments": <Paintbrush className="text-pink-500 w-5 h-5" />,
  "Shellac Nail Treatments": <Sparkles className="text-pink-500 w-5 h-5" />,
  "Waxing & Threading": <Scissors className="text-pink-500 w-5 h-5" />,
  "Eyebrows & Eyelashes": <Eye className="text-pink-500 w-5 h-5" />,
};
import { addDays } from "date-fns";
import { useRouter } from "next/navigation";


// Helper: parse a treatment name → duration in minutes
// (This needs to be available on the frontend for time slot calculation)
const extractMinutes = (text: string | undefined) => {
  if (!text) return null;
  const match = text.match(/(\d+)\s*(min|mins)/i);
  return match ? parseInt(match[1], 10) : null;
};

const parseDurationFrontend = (treatmentName: string) => {
  for (const section of TreatmentSections) {
    for (const treat of section.treatments) {
      if (treat.name === treatmentName) {
        const mins = extractMinutes(treat.time);
        return mins ?? 20; // Default to 20 minutes if no duration found
      }
      if (treat.children) {
        for (const child of treat.children) {
          if (child.name === treatmentName) {
            const mins = extractMinutes(child.name);
            return mins ?? 20; // Default to 20 minutes if no duration found
          }
        }
      }
    }
  }
  return 20; // Fallback
};


const Booking = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phonenumber, setNumber] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [selectedTreatments, setSelectedTreatments] = useState<{ name: string; price: number; parent?: string }[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ start: Date; end: Date }[]>([]);
  const [recaptchaPassed, setRecaptchaPassed] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const startISO = date?.toISOString();
  const router = useRouter();
  const [submitting, setSubmitting]   = useState(false); // Pay in store
  const [payingNow,  setPayingNow]    = useState(false); // Pay now
  const [openSection, setOpenSection] = useState<string | null>(null);

  const formatUKDateTime = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'long' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

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

// The following must go inside an `async` function or handler, like `handlePayment`

  const handlePayment = async () => {
    if (!recaptchaPassed || !agreedToTerms) return;
    setPayingNow(true);

    try {
      // Step 1: create the booking in the DB
      const bookingRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phonenumber,
          date: startISO, // make sure your API accepts this key as DateTime
          treatments: selectedTreatments,
          total: totalPrice,
        }),
      });

      if (!bookingRes.ok) {
        const errText = await bookingRes.text();      // body may contain the reason
        alert('Booking failed: ' + errText);
        console.error('Booking error:', errText);
        return;                                       // ⛔ stop here
      }

      const { booking } = await bookingRes.json(); // { id: '...' }

      // Step 2: create the Stripe Checkout session using that booking ID
      const sessionRes = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatments: selectedTreatments,
          total: totalPrice,
          customerEmail: email,
          bookingId: booking.id, // 👈 pass it along
        }),
      });

      if (!sessionRes.ok) {
        const errText = await sessionRes.text();
        alert('Payment initialisation failed: ' + errText);
        console.error('Stripe error:', errText);
        return;                                       // ⛔ stop here
      }

      const sessionData = await sessionRes.json();
      if (sessionData.url) {
        window.location.href = sessionData.url;
      } else {
        alert("Payment failed: " + sessionData.error);
      }

    } catch (err: any) {
      alert(err.message ?? "Payment Failed");
      console.error(err);
    } finally {
      setPayingNow(false);
    }
    
  };

  const toggleTreatment = (name: string, price: number, checked: boolean) => {
    if (checked) {
      setSelectedTreatments((prev) => [...prev, { name, price }]);
    } else {
      setSelectedTreatments((prev) => prev.filter((t) => t.name !== name));
    }
  };

  const totalPrice = selectedTreatments.reduce((sum, t) => sum + t.price, 0);

  // Calculate total duration based on selected treatments
  const totalAppointmentDuration = useMemo(() => {
    return selectedTreatments.reduce((sum, t) => sum + parseDurationFrontend(t.name), 0);
  }, [selectedTreatments]);

  const filterAvailableTimes = (time: Date) => {
    if (!date) return true; // Allows initial selection of any date, actual time filtering happens when a date is picked.

    const now = new Date();

    // 1) If `time` is today AND time < now → block
    if (isSameDay(time, now) && isBefore(time, now)) {
      return false;
    }

    // Calculate the end time of the proposed appointment slot
    const proposedEndTime = addMinutes(time, totalAppointmentDuration);

    // 2) Block if it overlaps ANY existing booking on that same date:
    return !bookedSlots.some((slot) =>
      isSameDay(slot.start, time) && // Only check slots on the same day
      (
        // Check for overlap: [proposed start, proposed end) overlaps with [slot start, slot end)
        (isBefore(time, slot.end) && isBefore(slot.start, proposedEndTime))
      )
    );
  };

  const next = async () => {
    if (step === 0 && (!name.trim() || !email.trim() || !phonenumber.trim())) {
      return alert("Please enter name, email and phone number");
    }
    if (step === 1 && selectedTreatments.length === 0) {
      return alert("Please select at least one treatment");
    }
    // ReCAPTCHA is moved inside the step progression, not in the button render logic
    if (step === 2) {
      if (!date) {
        return alert("Please select a date and time");
      }
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
    if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const prev = () => {
    setStep((s) => Math.max(s - 1, 0));

    if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  };

  const InlineSpinner = () => (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
  );
  
  const handleSubmit = async () => {
    if (!recaptchaPassed || !agreedToTerms) return;
    setSubmitting(true);
    try {
      const startISO = date?.toISOString();
      if (!startISO) { alert("Pick a time first"); return; }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phonenumber,
          date: startISO,
          treatments: selectedTreatments,
          total: totalPrice,
        }),
      });

      if (!res.ok) { throw new Error(await res.text()); }

      const { booking } = await res.json();
      router.push(`/success?booking_id=${booking.id}`);
    } catch (err: any) {
      alert("Booking failed: " + err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={formRef} className="bg-gray-50" id="bookings-section">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md">
        <div className="text-center">
          <p className="text-primary text-lg font-normal mb-3 tracking-widest uppercase">
            Book Appointment
          </p>
          <h2 className="text-3xl lg:text-5xl font-semibold text-black">
            No Booking Fees!
          </h2>
        </div>

        <div className="mx-auto mt-12 p-8 shadow rounded-xl text-black max-w-xl">
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
              <input
                type="phonenumber"
                placeholder="Your Phone Number"
                className="w-full border p-2 rounded bg-gray-50"
                value={phonenumber}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary mb-4">Select Treatments</h2>

              {TreatmentSections.map((section) => (
                <div key={section.title} className="border rounded-lg overflow-hidden shadow-sm">
                  <button
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-pink-50 transition"
                    onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
                  >
                    <div className="flex items-center gap-3 text-left">
                      {sectionIcons[section.title]}
                      <span className="font-semibold text-lg text-primary">{section.title}</span>

                      {/* Count how many selected treatments are in this section */}
                      {(() => {
                        const selectedCount = selectedTreatments.filter((t) =>
                          section.treatments.some((s) =>
                            s.children
                              ? s.children.some((c) => c.name === t.name)
                              : s.name === t.name
                          )
                        ).length;

                        return selectedCount > 0 ? (
                          <span className="ml-2 bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {selectedCount}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <span className="text-gray-500">{openSection === section.title ? "−" : "+"}</span>
                  </button>


                  {openSection === section.title && (
                    <div className="bg-gray-50 p-4 space-y-2">
                      {section.treatments.map((treat) => {
                        if (treat.children) {
                          return (
                            <div key={treat.name}>
                              <p className="font-semibold">{treat.name}</p>
                              <div className="pl-4">
                                {treat.children.map((child, index) => {
                                  const priceNum = parseFloat(child.price.replace(/[^0-9.]/g, ""));
                                  const isChecked = selectedTreatments.some((t) => t.name === child.name);
                                  const radioName = `group-${treat.name.replace(/\s+/g, '-')}`;

                                  return (
                                    <label
                                      key={child.name}
                                      className={`flex items-center space-x-3 mb-1 p-2 rounded transition ${
                                      isChecked ? 'bg-pink-100' : ''
                                    }`}
                                    >
                                      <input
                                        type="radio"
                                        name={radioName}
                                        checked={isChecked}
                                        onClick={() => {
                                          setSelectedTreatments((prev) => {
                                            const isAlreadySelected = prev.some((t) => t.name === child.name);
                                            const withoutGroup = prev.filter(
                                              (t) => !(treat.children?.some((c) => c.name === t.name))
                                            );
                                            return isAlreadySelected
                                              ? withoutGroup
                                              : [...withoutGroup, { name: child.name, price: priceNum, parent: treat.name }];
                                          });
                                        }}
                                        className="form-radio h-4 w-4 text-pink-500 border-gray-300 focus:ring-pink-400"
                                      />
                                      <span className="flex-1 text-gray-800">{child.name}</span>
                                      <span className="text-gray-600">{child.price}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        if (treat.price) {
                          const priceNum = parseFloat(treat.price.replace(/[^0-9.]/g, ""));
                          const isChecked = selectedTreatments.some((t) => t.name === treat.name);

                          return (
                            <label
                              key={treat.name}
                              className={`flex items-center justify-between p-2 rounded transition ${
                                isChecked ? 'bg-pink-100' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) =>
                                    toggleTreatment(treat.name, priceNum, e.target.checked)
                                  }
                                  className="form-checkbox h-4 w-4 text-pink-500 border-gray-300 focus:ring-pink-400"
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
                  )}
                </div>
              ))}

              <div className="text-right font-semibold pt-4">
                Total: £{totalPrice.toFixed(2)}
              </div>
            </div>
          )}


          {step === 2 && (
            <div>
              {email.trim() === "" || phonenumber.trim() === "" ? ( // Check for both email and phone number
                <p className="text-red-600 font-medium">
                  Please enter your email and phone number first to see available slots.
                </p>
              ) : (
                <DatePicker
                  selected={date}
                  onChange={(d) => setDate(d)}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"  // Changed to UK format
                  timeCaption="Time (UK)"
                  minDate={new Date()}
                  maxDate={addDays(new Date(), 30)}
                  filterDate={(d) => !isSunday(d)}
                  filterTime={filterAvailableTimes}
                  placeholderText="Pick a Date & Time"
                  minTime={setHours(setMinutes(new Date(), 0), 10)}
                  maxTime={setHours(setMinutes(new Date(), 0), 17)}
                  className="w-full border p-2 rounded bg-gray-50"
                  required
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-center">
              <p>
                <strong>Name:</strong> {name}
              </p>
              <p>
                <strong>Email:</strong> {email}
              </p>
              <p>
                <strong>Phone number:</strong> {phonenumber}
              </p>
              <p>
                <strong>Time:</strong> {date ? formatUKDateTime(date) : ''}
              </p>
              <p>
                <strong>Treatments:</strong>
              </p>
              <ul className="list-disc list-inside">
                {selectedTreatments.map((t, i) => (
                  <li key={i}>
                    {t.parent ? `${t.parent} – ${t.name}` : t.name} - £{t.price.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="font-semibold">Total: £{totalPrice.toFixed(2)}</p>

              {/* Terms checkbox */}
              <div className="flex flex-col items-center mt-6">
                <label className="flex items-start gap-3 max-w-sm">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700 text-left">
                    I agree to the{" "}
                    <a
                      href="/terms-and-conditions"
                      className="text-pink-600 underline hover:text-pink-800"
                      target="_blank"
                    >
                      terms and conditions
                    </a>{" "}
                    &{" "}
                    <a
                      href="/privacy-policy"
                      className="text-pink-600 underline hover:text-pink-800"
                      target="_blank"
                    >
                      privacy policy
                    </a>.
                  </span>
                </label>
              </div>

              {/* Book button (disabled until reCAPTCHA passes & terms checked) */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !recaptchaPassed || !agreedToTerms}
                className={`bg-primary text-white font-semibold py-2 px-6 rounded-lg mt-8 transition ${
                  recaptchaPassed && agreedToTerms && !submitting
                    ? "hover:bg-pink-600 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {submitting ? <InlineSpinner /> : "Pay in store (cash)"}
              </button>
              <h2 className="text-center">Or</h2>
              <button
                onClick={handlePayment}
                disabled={payingNow || !recaptchaPassed || !agreedToTerms}
                className={`bg-primary text-white font-semibold py-2 px-6 rounded-lg mt-4 transition ${
                  recaptchaPassed && agreedToTerms && !payingNow
                    ? "hover:bg-pink-600 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {payingNow ? <InlineSpinner /> : "Pay now"}
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
                className={`px-4 py-2 rounded-lg ${
                    (step === 0 && (!name.trim() || !email.trim() || !phonenumber.trim())) ||
                    (step === 1 && selectedTreatments.length === 0) ||
                    (step === 2 && !date)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-pink-600'
                }`}
                disabled={
                    (step === 0 && (!name.trim() || !email.trim() || !phonenumber.trim())) ||
                    (step === 1 && selectedTreatments.length === 0) ||
                    (step === 2 && !date)
                }
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