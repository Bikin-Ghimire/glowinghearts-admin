// app/(admin)/users/create/page.tsx
import { CreateUserForm } from '@/components/user/create-user-form'
import { Toaster } from 'react-hot-toast'

export default function CreateUserPage() {
  return (
    <div className="p-6">
      <Toaster position='top-right' />
      <CreateUserForm />
    </div>
  )
}