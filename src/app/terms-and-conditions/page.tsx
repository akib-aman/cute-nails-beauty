const TermsAndConditionsPage = () => (
  <div className="max-w-3xl mx-auto py-64 px-6 text-sm leading-6 text-white">
    <h1 className="text-2xl font-bold mb-6">Terms & Conditions</h1>
    <p>By booking an appointment at Cute Beauty Salon, you agree to the following terms:</p>
    <ul className="list-disc ml-6 mt-4 space-y-2">
      <li>All bookings require a valid name and email.</li>
      <li>Please arrive 5 minutes before your scheduled appointment.</li>
      <li>We reserve the right to refuse service if you are late by more than 10 minutes without notice.</li>
      <li>Cancellations must be made at least 24 hours in advance.</li>
      <li>No shows may be charged a fee or restricted from future bookings.</li>
    </ul>
    <p className="mt-6">These terms help us serve all clients fairly and efficiently. Thank you for your understanding.</p>
  </div>
);

export default TermsAndConditionsPage;
