import { useState } from 'react';
import { Button } from '@/components/button'; // Adjust the path as needed

interface Props {
  email: string;
  charityName: string;
  charityId: string;
}

export function SendOnboardingButton({ email, charityName, charityId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/send-onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, charityName, charityId }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to send invite');
      alert('Onboarding email sent!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Sending...' : 'Send Stripe Onboarding Email'}
      </Button>
      {error && <p className="text-sm text-red-600">❌ {error}</p>}
    </div>
  );
}