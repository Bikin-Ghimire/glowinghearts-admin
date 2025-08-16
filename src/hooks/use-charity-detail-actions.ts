import { activateCharity, deactivateCharity } from '@/lib/charities'
import { updateCharityStatus } from '@/lib/charities'

export function useCharityDetailActions(session: any, setCharity: () => void) {
  return {
    handleActivate: (id: string) =>
      updateCharityStatus({
        session,
        id,
        newStatus: 1,
        updateFn: setCharity,
        apiFn: activateCharity,
      }),
    handleDeactivate: (id: string) =>
      updateCharityStatus({
        session,
        id,
        newStatus: 2,
        updateFn: setCharity,
        apiFn: deactivateCharity,
      }),
  }
}