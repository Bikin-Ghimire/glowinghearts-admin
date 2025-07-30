
import { activateRaffle, updateRaffleStatus } from '@/lib/raffles'

export function useRaffleDetailActions(session: any, setRaffle: Function) {
  return {
    handleActivate: (id: string) =>
      updateRaffleStatus({
        session,
        id,
        newStatus: 1,
        updateFn: setRaffle,
        apiFn: activateRaffle,
      }),
    handleDeactivate: (id: string) =>
      updateRaffleStatus({
        session,
        id,
        newStatus: 2,
        updateFn: setRaffle,
        apiFn: deactivateRaffle,
      }),
  }
}