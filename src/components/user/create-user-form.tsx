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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = userSchema.safeParse(formData)

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
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
      className="mx-auto mt-6 max-w-lg space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-md
                 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <h2 className="text-2xl font-semibold">Create New User</h2>

      {/* First Name */}
      <div>
        <label
          htmlFor="VC_FirstName"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          First Name
        </label>
        <input
          id="VC_FirstName"
          name="VC_FirstName"
          value={formData.VC_FirstName}
          onChange={handleChange}
          autoComplete="given-name"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900
                     placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300
                     dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                     dark:focus:ring-zinc-600"
        />
        {formErrors.VC_FirstName && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{formErrors.VC_FirstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label
          htmlFor="VC_LastName"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Last Name
        </label>
        <input
          id="VC_LastName"
          name="VC_LastName"
          value={formData.VC_LastName}
          onChange={handleChange}
          autoComplete="family-name"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900
                     placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300
                     dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                     dark:focus:ring-zinc-600"
        />
        {formErrors.VC_LastName && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{formErrors.VC_LastName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="VC_Email"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id="VC_Email"
          name="VC_Email"
          type="email"
          value={formData.VC_Email}
          onChange={handleChange}
          autoComplete="email"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900
                     placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300
                     dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                     dark:focus:ring-zinc-600"
        />
        {formErrors.VC_Email && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{formErrors.VC_Email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50
                   dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-white dark:text-zinc-900"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Creating...
          </span>
        ) : (
          'Create User'
        )}
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircleIcon className="h-5 w-5" /> User created.
        </div>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        The system will generate a secure password and email the user their credentials.
      </p>
    </form>
  )
}