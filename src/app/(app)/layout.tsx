import { getEvents } from '@/data'
import { ApplicationLayout } from './application-layout'
import SessionWrapper from '@/components/session-wrapper'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let events = await getEvents()

  return (
    <SessionWrapper>
      <ApplicationLayout events={events}>{children}</ApplicationLayout>
    </SessionWrapper>
  )
}
