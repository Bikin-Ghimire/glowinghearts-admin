import { ApplicationLayout } from './application-layout'
import SessionWrapper from '@/components/session-wrapper'
import 'react-quill/dist/quill.snow.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <SessionWrapper>
      <ApplicationLayout>{children}</ApplicationLayout>
    </SessionWrapper>
  )
}
