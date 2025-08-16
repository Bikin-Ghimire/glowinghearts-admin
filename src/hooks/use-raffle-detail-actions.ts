
import { activateRaffle, deactivateRaffle, updateRaffleStatus } from '@/lib/raffles'

export function useRaffleDetailActions(session: any, setRaffle: (updater: any) => void) {
  return {
    handleActivate: (id: string) =>
      updateRaffleStatus({
        session,
        id,
        newStatus: 2,
        updateFn: setRaffle,
        apiFn: activateRaffle,
      }),
    handleDeactivate: (id: string) =>
      updateRaffleStatus({
        session,
        id,
        newStatus: 6,
        updateFn: setRaffle,
        apiFn: deactivateRaffle,
      }),
  }
}