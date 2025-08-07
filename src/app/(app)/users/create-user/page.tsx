// app/(admin)/users/create/page.tsx
import { CreateUserForm } from '@/components/user/create-user-form'

export default function CreateUserPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create New User</h1>
      <CreateUserForm />
    </div>
  )
}