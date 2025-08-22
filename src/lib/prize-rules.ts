// lib/prize-rules.ts
export const PrizeType = {
  FiftyFifty: 1,
  PrizeRaffle: 2,
  EarlyBird: 3,
} as const
export type PrizeTypeKey = keyof typeof PrizeType
export type PrizeTypeVal = typeof PrizeType[PrizeTypeKey]

// naive parse of "YYYY-MM-DD HH:mm:ss" into local Date
export function parseServerDT(s: string) {
  if (!s) return new Date('1970-01-01T00:00:00')
  return new Date(s.replace(' ', 'T'))
}

export function formatServerDT(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

export function computeNextPlace(prizes: any[]) {
  const max = prizes.reduce((m, p) => Math.max(m, Number(p.Int_Place ?? 0)), 0)
  return (max || 0) + 1
}

export function getTopPrize(prizes: any[]) {
  return prizes.find((p) => Number(p.Int_Place) === 1) ?? null
}

export function canDeletePrize(prize: any) {
  return Number(prize?.Int_Place) !== 1
}

export type EditContext = {
  raffle: { Dt_SaleOpen: string; Dt_SaleClose: string }
  prizes: any[]
  existingPrize: any
}

export function normalizeAndValidatePrizePayload(
  payload: {
    Int_Place: number
    Int_Prize_Type: number
    Int_AutomatedDraw: number
    VC_Description: string
    Int_PrizeValuePercent: number
    Dec_Value: number
    Dt_Draw: string
  },
  ctx: EditContext
) {
  const isTop = Number(payload.Int_Place) === 1
  const saleOpen = parseServerDT(ctx.raffle.Dt_SaleOpen)
  const saleClose = parseServerDT(ctx.raffle.Dt_SaleClose)
  const draw = parseServerDT(payload.Dt_Draw)
  const top = getTopPrize(ctx.prizes)

  if (isTop) {
    if (![PrizeType.FiftyFifty, PrizeType.PrizeRaffle].includes(Number(payload.Int_Prize_Type))) {
      throw new Error('The prize with Int_Place 1 must be a 50/50 Cash Prize or a Prize Raffle.')
    }
    if (!(draw.getTime() > saleClose.getTime())) {
      throw new Error('Top prize draw must be AFTER the sales end date.')
    }
    if (Number(payload.Int_Prize_Type) === PrizeType.FiftyFifty) {
      payload.Int_PrizeValuePercent = 1
      payload.Dec_Value = 0.5
      if (!payload.VC_Description?.trim()) payload.VC_Description = '50% of Total Jackpot'
    } else {
      payload.Int_PrizeValuePercent = 0
      if (!(payload.Dec_Value > 0)) {
        throw new Error('Please provide a fixed prize amount for the top Prize Raffle.')
      }
    }
  } else {
    if (![PrizeType.PrizeRaffle, PrizeType.EarlyBird].includes(Number(payload.Int_Prize_Type))) {
      throw new Error('Additional prizes must be Prize Raffle or Earlybird.')
    }
    payload.Int_PrizeValuePercent = 0
    if (!(payload.Dec_Value > 0)) {
      throw new Error('Please provide a positive fixed prize amount.')
    }
    if (!top) throw new Error('Top prize (Int_Place 1) is required before adding other prizes.')
    const topDraw = parseServerDT(top.Dt_Draw)
    if (!(draw.getTime() >= saleOpen.getTime() && draw.getTime() < topDraw.getTime())) {
      throw new Error('This prize draw must be between sales start and the top prize draw date.')
    }
  }

  return payload
}