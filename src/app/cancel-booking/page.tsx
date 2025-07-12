import { Suspense } from 'react';
import CancelAppointmentClient from './CancelAppointmentClient';

export default function CancelBookingPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center">Loading appointment…</div>}>
      <CancelAppointmentClient />
    </Suspense>
  );
}
