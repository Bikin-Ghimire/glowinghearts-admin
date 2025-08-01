// hooks/useRaffleForm.ts
import { useState } from 'react'

export function useRaffleForm() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [charities, setCharities] = useState<any[]>([])
  const [selectedCharity, setSelectedCharity] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [licenseNo, setLicenseNo] = useState('')
  const [raffleName, setRaffleName] = useState('')
  const [raffleLocation, setRaffleLocation] = useState('')
  const [raffleDescription, setRaffleDescription] = useState('')
  const [raffleRules, setRaffleRules] = useState('')
  const [salesStartDate, setSalesStartDate] = useState('')
  const [salesEndDate, setSalesEndDate] = useState('')
  const [bannerLink, setBannerLink] = useState('')

  const [prizes, setPrizes] = useState([
    {
      place: '',
      type: 1,
      automated_draw: 1,
      name: '',
      amount: '',
      isPercentage: 0,
      prizeValue: '',
      drawDate: '',
      ticketId: null,
    },
  ])

  const [bundles, setBundles] = useState([
    { numberOfTickets: '', price: '', description: '' },
  ])

  return {
    // Navigation
    currentStepIndex,
    setCurrentStepIndex,

    // Charity
    charities,
    setCharities,
    selectedCharity,
    setSelectedCharity,
    query,
    setQuery,

    // Raffle info
    licenseNo,
    setLicenseNo,
    raffleName,
    setRaffleName,
    raffleLocation,
    setRaffleLocation,
    raffleDescription,
    setRaffleDescription,
    raffleRules,
    setRaffleRules,
    salesStartDate,
    setSalesStartDate,
    salesEndDate,
    setSalesEndDate,
    bannerLink,
    setBannerLink,

    // Prizes
    prizes,
    setPrizes,

    // Ticket Bundles
    bundles,
    setBundles,
  }
}