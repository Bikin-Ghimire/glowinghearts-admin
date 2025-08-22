// lib/prize-rules.ts
export const PRIZE_TYPES = {
  FIFTY_FIFTY_CASH: 1, // 50/50 Cash Prize
  PRIZE_RAFFLE: 2, // Prize Raffle
  EARLY_BIRD: 3, // Earlybird raffle
} as const
export type PrizeType = (typeof PRIZE_TYPES)[keyof typeof PRIZE_TYPES]

export type RaffleCore = {
  Dt_SaleOpen: string // "YYYY-MM-DD HH:mm:ss"
  Dt_SaleClose: string
}

export type Prize = {
  Guid_PrizeId: string
  Int_Place: number
  Int_Prize_Type: PrizeType
  Int_AutomatedDraw: number
  VC_Description: string
  Int_PrizeValuePercent: number
  Dec_Value: number
  Dt_Draw: string
}

export type PrizePayload = {
  Int_Place: number
  Int_Prize_Type: PrizeType
  Int_AutomatedDraw: number
  VC_Description: string
  Int_PrizeValuePercent: number
  Dec_Value: number
  Dt_Draw: string
}

function toDate(s?: string) {
  if (!s || typeof s !== 'string') return new Date(NaN)
  return new Date(s.replace(' ', 'T'))
}

export function getMainPrize(prizes: Prize[]) {
  return prizes.find((p) => p.Int_Place === 1) || null
}

export function nextPlace(prizes: Prize[]) {
  const max = prizes.reduce((m, p) => Math.max(m, p.Int_Place || 0), 0)
  return Math.max(1, max + 1)
}

export function canDeletePrize(prize: Prize) {
  // 1) The prize with Int_Place 1 should not be deletable.
  return prize.Int_Place !== 1
}

// Hard validation & normalization for edit (update)
export function normalizeAndValidatePrizeUpdate(
  payload: PrizePayload,
  raffle: RaffleCore,
  prizes: Prize[],
  targetPrizeId: string
): { ok: true; normalized: PrizePayload } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const isPlace1 = payload.Int_Place === 1
  const mainPrize = getMainPrize(prizes)
  const saleOpen = toDate(raffle.Dt_SaleOpen)
  const saleClose = toDate(raffle.Dt_SaleClose)
  const dtDraw = toDate(payload.Dt_Draw)

  if (Number.isNaN(saleOpen.getTime()) || Number.isNaN(saleClose.getTime())) {
    return { ok: false, errors: ['Raffle sales window is missing/invalid.'] }
  }
  if (Number.isNaN(dtDraw.getTime())) {
    return { ok: false, errors: ['Draw date/time is required and must be valid.'] }
  }

  // Prevent editing Int_Place into/out of 1 for existing others
  const current = prizes.find((p) => p.Guid_PrizeId === targetPrizeId)
  if (current) {
    if (current.Int_Place === 1 && payload.Int_Place !== 1) {
      errors.push('Main prize (Place 1) cannot be moved to another place.')
    }
    if (current.Int_Place !== 1 && payload.Int_Place === 1) {
      errors.push('You cannot promote a non-main prize to Place 1.')
    }
  }

  // 2) Int_Place auto-increment rule is for creation. For edit, we just forbid invalid moves.
  // (Nothing to do here—creation path should use nextPlace())

  // 1.1) Place 1 must be 50/50 Cash (1) or Prize Raffle (2)
  if (
    isPlace1 &&
    !(payload.Int_Prize_Type === PRIZE_TYPES.FIFTY_FIFTY_CASH || payload.Int_Prize_Type === PRIZE_TYPES.PRIZE_RAFFLE)
  ) {
    errors.push('Place 1 must be either "50/50 Cash Prize" or "Prize Raffle".')
  }

  // 2) & 3) & 3.1) Normalize hidden fields based on type
  let normalized: PrizePayload = { ...payload }

  if (payload.Int_Prize_Type === PRIZE_TYPES.FIFTY_FIFTY_CASH) {
    // - Prize amount always 0.5, and Int_PrizeValuePercent = 1
    normalized.Dec_Value = 0.5
    normalized.Int_PrizeValuePercent = 1
    // - Name auto to "50% of Total Jackpot" (editable by user; we set default only if blank)
    if (!normalized.VC_Description?.trim()) {
      normalized.VC_Description = '50% of Total Jackpot'
    }
  } else {
    // - Prize in percentage is always 0 (do not show in UI)
    normalized.Int_PrizeValuePercent = 0
    // - Amount must be user-entered and > 0
    if (!(normalized.Dec_Value > 0)) {
      errors.push('Prize amount must be greater than 0 for non-50/50 prize types.')
    }
  }

  // 5) Draw date for Place 1 must be AFTER sales end date
  if (isPlace1) {
    if (!(dtDraw.getTime() > saleClose.getTime())) {
      errors.push('Main prize (Place 1) draw must be AFTER the sales end date.')
    }
  } else {
    // 6) Any other prize must be Prize Raffle or Earlybird raffle
    if (
      !isPlace1 &&
      !(normalized.Int_Prize_Type === PRIZE_TYPES.PRIZE_RAFFLE || normalized.Int_Prize_Type === PRIZE_TYPES.EARLY_BIRD)
    ) {
      errors.push('Non-main prizes must be "Prize Raffle" or "Earlybird raffle".')
    }

    // 8) Draw date must be BETWEEN sales start and main prize draw date
    const mainDrawDate =
      current?.Int_Place === 1
        ? dtDraw // editing main prize itself (already handled above)
        : mainPrize
          ? toDate(mainPrize.Dt_Draw)
          : null

    if (!mainDrawDate) {
      errors.push('Cannot validate: main prize draw date is missing.')
    } else {
      if (!(dtDraw.getTime() >= saleOpen.getTime() && dtDraw.getTime() < mainDrawDate.getTime())) {
        errors.push('Draw date must be between sales start and the main prize draw date.')
      }
    }
  }

  if (errors.length) return { ok: false, errors }
  return { ok: true, normalized }
}

// Useful in Create path (kept here for completeness)
export function normalizeAndValidatePrizeCreate(
  draft: Omit<PrizePayload, 'Int_Place'> & { Int_Place?: number },
  raffle: RaffleCore,
  prizes: Prize[]
): { ok: true; normalized: PrizePayload } | { ok: false; errors: string[] } {
  const place = draft.Int_Place ?? nextPlace(prizes)
  return normalizeAndValidatePrizeUpdate(
    { ...(draft as PrizePayload), Int_Place: place },
    raffle,
    prizes,
    '' // no target id on create
  )
}
