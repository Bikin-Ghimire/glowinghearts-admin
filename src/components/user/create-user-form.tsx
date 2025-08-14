'use client'

import { useCreateUser } from '@/hooks/use-create-user'
import { useState } from 'react'
import { z } from 'zod'
import { CheckCircleIcon } from '@heroicons/react/20/solid'

const userSchema = z.object({
  VC_FirstName: z.string().min(1, 'First name is required'),
  VC_LastName: z.string().min(1, 'Last name is required'),
  VC_Email: z.string().email('Invalid email'),
})

export function CreateUserForm() {
  const { createUser, loading, error, success } = useCreateUser()
  const [formData, setFormData] = useState({
    VC_FirstName: '',
    VC_LastName: '',
    VC_Email: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = userSchema.safeParse(formData)

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path?.[0] as string
        if (field) errors[field] = issue.message
      })
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    const ok = await createUser(result.data)
    if (ok) {
      setFormData({ VC_FirstName: '', VC_LastName: '', VC_Email: '' })
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-6 max-w-lg rounded-lg bg-white p-6 shadow-md space-y-6"
    >
      <h2 className="text-2xl font-semibold text-gray-800">Create New User</h2>

      {/* First Name */}
      <div>
        <label htmlFor="VC_FirstName" className="mb-1 block text-sm font-medium text-gray-700">
          First Name
        </label>
        <input
          id="VC_FirstName"
          name="VC_FirstName"
          value={formData.VC_FirstName}
          onChange={handleChange}
          autoComplete="given-name"
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-300"
        />
        {formErrors.VC_FirstName && (
          <p className="mt-1 text-sm text-red-500">{formErrors.VC_FirstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label htmlFor="VC_LastName" className="mb-1 block text-sm font-medium text-gray-700">
          Last Name
        </label>
        <input
          id="VC_LastName"
          name="VC_LastName"
          value={formData.VC_LastName}
          onChange={handleChange}
          autoComplete="family-name"
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-300"
        />
        {formErrors.VC_LastName && (
          <p className="mt-1 text-sm text-red-500">{formErrors.VC_LastName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="VC_Email" className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="VC_Email"
          name="VC_Email"
          type="email"
          value={formData.VC_Email}
          onChange={handleChange}
          autoComplete="email"
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-300"
        />
        {formErrors.VC_Email && (
          <p className="mt-1 text-sm text-red-500">{formErrors.VC_Email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create User'}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircleIcon className="h-5 w-5" /> User created.
        </div>
      )}

      <p className="text-xs text-gray-500">
        The system will generate a secure password and email the user their credentials.
      </p>
    </form>
  )
}