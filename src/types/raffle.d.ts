export type Prize = {
  name: string
  amount: string
  type: number
  isPercentage: number
  drawDate: string
  ticketId: string | null
}

export type Bundle = {
  numberOfTickets: string
  price: string
  description: string
}

export type RNGRange = {
  id: number
  from: number
  to: number
}

export interface RaffleFormData {
  licenseNo: string
  raffleName: string
  raffleLocation: string
  raffleDescription: string
  raffleRules: string
  salesStartDate: string
  salesEndDate: string
  bannerLink: string
  prizes: Prize[]
  bundles: Bundle[]
  rng: RNGRange[]
}