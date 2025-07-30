export const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});

// utils/statusMaps.ts
export const charityStatusMap: Record<number, { label: string; color: 'lime' | 'red' | 'zinc' }> = {
  1: { label: 'Active', color: 'lime' },
  2: { label: 'Disabled', color: 'red' },
  3: { label: 'Review', color: 'zinc' },
}

export const raffleStatusMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Not Started', color: 'zinc' },
  2: { label: 'Active', color: 'lime' },
  3: { label: 'Sales Complete', color: 'amber' },
  4: { label: 'Draw Complete', color: 'cyan' },
  5: { label: 'Paid Out', color: 'emerald' },
  6: { label: 'On Hold', color: 'red' },
}