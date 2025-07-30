'use client';

import { useState } from 'react';

export default function StripeRefreshPage() {
  const [email, setEmail] = useState('');
  const [charityName, setCharityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/send-onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, charityName }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to send onboarding link');
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-24 p-6 border rounded-md shadow-sm">
      <h1 className="text-xl font-semibold mb-4 text-gray-800">Onboarding Link Expired</h1>
      <p className="text-gray-600 mb-6">
        It looks like your Stripe onboarding link has expired or been used already. Please enter your charity email and name below to receive a new link.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleResend();
        }}
        className="flex flex-col gap-4"
      >
        <label className="text-sm font-medium">
          Charity Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </label>

        <label className="text-sm font-medium">
          Charity Name
          <input
            type="text"
            required
            value={charityName}
            onChange={(e) => setCharityName(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-fuchsia-600 text-white px-4 py-2 rounded-md hover:bg-fuchsia-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Resend Onboarding Email'}
        </button>
      </form>

      {status === 'success' && (
        <p className="mt-4 text-green-600">✅ New onboarding link has been sent!</p>
      )}
      {status === 'error' && (
        <p className="mt-4 text-red-600">❌ {errorMessage}</p>
      )}
    </main>
  );
}