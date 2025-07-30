import { activateCharity, deactivateCharity, updateCharityStatus } from '@/lib/charities'

export function useCharityListActions(session: any, refetchCharities: () => void) {
  return {
    handleActivate: (id: string) =>
      updateCharityStatus({
        session,
        id,
        newStatus: 1,
        updateFn: refetchCharities,
        apiFn: activateCharity,
      }),
    handleDeactivate: (id: string) =>
      updateCharityStatus({
        session,
        id,
        newStatus: 2,
        updateFn: refetchCharities,
        apiFn: deactivateCharity,
      }),
  }
}