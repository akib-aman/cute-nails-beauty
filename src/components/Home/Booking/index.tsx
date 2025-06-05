"use client";
import React, { useEffect, useState, useMemo } from "react"; // Added useMemo
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isSunday, setHours, setMinutes, isSameDay, isAfter, isBefore, addMinutes } from "date-fns"; // Added addMinutes
import {
  TreatmentSections,
  TreatmentSection,
  Treatment,
  ChildTreatment,
} from "@/app/api/data";
import { load } from 'recaptcha-v3';


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
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phonenumber, date, treatments: selectedTreatments, total: totalPrice }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Booking confirmed! Please check your emails for a receipt.");
      location.reload();
    } else {
      alert(data.message);
    }
  };


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
                              {treat.children.map((child: ChildTreatment, index: number) => {
                                const priceNum = parseFloat(child.price.replace(/[^0-9.]/g, ""));
                                const isChecked = selectedTreatments.some((t) => t.name === child.name);

                                const radioName = `group-${treat.name.replace(/\s+/g, '-')}`;
                                const radioId = `${radioName}-${index}`;

                                return (
                                  <label
                                    key={child.name}
                                    htmlFor={radioId}
                                    className="flex items-center space-x-3 mb-1"
                                  >
                                    <input
                                      type="radio"
                                      id={radioId}
                                      name={radioName}
                                      checked={isChecked}
                                      onClick={() => {
                                        setSelectedTreatments((prev) => {
                                          const isAlreadySelected = prev.some((t) => t.name === child.name);

                                          if (isAlreadySelected) {
                                            // Deselect it
                                            return prev.filter((t) => t.name !== child.name);
                                          } else {
                                            // Remove other children in group
                                            const withoutGroup = prev.filter(
                                              (t) =>
                                                !(
                                                  treat.children?.some((c) => c.name === t.name)
                                                )
                                            );
                                            return [...withoutGroup, { name: child.name, price: priceNum, parent: treat.name }];
                                          }
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
                  dateFormat="MMMM d, yyyy h:mm aa" // Corrected dateFormat
                  minDate={new Date()}
                  filterDate={(d) => !isSunday(d)}
                  filterTime={filterAvailableTimes}
                  placeholderText="Pick a Date & Time!"
                  minTime={setHours(setMinutes(new Date(), 0), 10)}
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
                <strong>Phone number:</strong> {phonenumber}
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
                disabled={!recaptchaPassed || !agreedToTerms}
                className={`bg-primary text-white font-semibold py-2 px-6 rounded-lg mt-4 transition ${
                  recaptchaPassed && agreedToTerms
                    ? "hover:bg-pink-600 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
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