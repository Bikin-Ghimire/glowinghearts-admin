// lib/prize-bulk-rules.ts
import { PrizeType, parseServerDT } from '@/lib/prize-rules'

type RaffleLike = { Dt_SaleOpen: string; Dt_SaleClose: string }

/** Throws descriptive Error on first failure; return true if OK */
export function validateAllPrizes(prizes: any[], raffle: RaffleLike) {
  if (!Array.isArray(prizes) || prizes.length === 0) {
    throw new Error('At least one prize is required.')
  }

  const saleOpen = parseServerDT(raffle.Dt_SaleOpen)
  const saleClose = parseServerDT(raffle.Dt_SaleClose)

  const place1 = prizes.filter((p) => Number(p.Int_Place) === 1)
  if (place1.length !== 1) throw new Error('Exactly one prize must have Int_Place = 1.')

  const top = place1[0]
  const topType = Number(top.Int_Prize_Type)
  const topDraw = parseServerDT(top.Dt_Draw)

  if (![PrizeType.FiftyFifty, PrizeType.PrizeRaffle].includes(topType)) {
    throw new Error('Top prize (Int_Place 1) must be 50/50 Cash Prize or Prize Raffle.')
  }
  if (!(topDraw.getTime() > saleClose.getTime())) {
    throw new Error('Top prize draw must be AFTER sales end.')
  }
  if (topType === PrizeType.FiftyFifty) {
    if (Number(top.Int_PrizeValuePercent) !== 1 || Number(top.Dec_Value) !== 0.5) {
      throw new Error('For 50/50: Int_PrizeValuePercent must be 1 and Dec_Value must be 0.5.')
    }
  } else {
    if (Number(top.Int_PrizeValuePercent) !== 0 || !(Number(top.Dec_Value) > 0)) {
      throw new Error('For Prize Raffle top prize: percentage must be 0 and amount must be > 0.')
    }
  }

  for (const p of prizes) {
    if (Number(p.Int_Place) === 1) continue
    const t = Number(p.Int_Prize_Type)
    if (![PrizeType.PrizeRaffle, PrizeType.EarlyBird].includes(t)) {
      throw new Error('Non-top prizes must be Prize Raffle or Earlybird.')
    }
    if (Number(p.Int_PrizeValuePercent) !== 0) throw new Error('Non-top prizes must have percentage = 0.')
    if (!(Number(p.Dec_Value) > 0)) throw new Error('Non-top prizes must have a positive fixed amount.')
    const draw = parseServerDT(p.Dt_Draw)
    if (!(draw.getTime() >= saleOpen.getTime() && draw.getTime() < topDraw.getTime())) {
      throw new Error('Each non-top prize draw must be between sales start and the top prize draw.')
    }
  }

  return true
}