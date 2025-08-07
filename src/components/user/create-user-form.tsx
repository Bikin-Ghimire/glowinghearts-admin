'use client'

import { useCreateUser } from '@/hooks/use-create-user'
import { useState } from 'react'
import { z } from 'zod'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const userSchema = z.object({
  VC_FirstName: z.string().min(1, 'First name is required'),
  VC_LastName: z.string().min(1, 'Last name is required'),
  VC_Email: z.string().email('Invalid email'),
  VC_Pwd: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[0-9]/, 'Must include a number')
    .regex(/[\W_]/, 'Must include a special character'),
})

export function CreateUserForm() {
  const { createUser, loading, error, success } = useCreateUser()
  const [formData, setFormData] = useState({
    VC_FirstName: '',
    VC_LastName: '',
    VC_Email: '',
    VC_Pwd: '',
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = userSchema.safeParse(formData)

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error?.issues?.forEach((err) => {
        const field = err.path?.[0] as string
        if (field) errors[field] = err.message
      })

      setFormErrors(errors)
      return
    }

    setFormErrors({})
    await createUser(result.data)
  }

  // Password strength helper
  const getPasswordStrength = (password: string) => {
    const checks = [
      /.{8,}/.test(password), // min 8 characters
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[\W_]/.test(password),
    ]
    const passed = checks.filter(Boolean).length
    return { passed, total: checks.length }
  }

  const passwordStrength = getPasswordStrength(formData.VC_Pwd)

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-6 max-w-lg rounded-lg bg-white p-6 shadow-md space-y-6"
    >
      <h2 className="text-2xl font-semibold text-gray-800">Create New User</h2>

      {/* First Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
        <input
          name="VC_FirstName"
          value={formData.VC_FirstName}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-300"
        />
        {formErrors.VC_FirstName && <p className="mt-1 text-sm text-red-500">{formErrors.VC_FirstName}</p>}
      </div>

      {/* Last Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
        <input
          name="VC_LastName"
          value={formData.VC_LastName}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-300"
        />
        {formErrors.VC_LastName && <p className="mt-1 text-sm text-red-500">{formErrors.VC_LastName}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input
          name="VC_Email"
          type="email"
          value={formData.VC_Email}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-300"
        />
        {formErrors.VC_Email && <p className="mt-1 text-sm text-red-500">{formErrors.VC_Email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <div className="relative">
          <input
            name="VC_Pwd"
            type={showPassword ? 'text' : 'password'}
            value={formData.VC_Pwd}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:ring focus:ring-blue-300"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 flex items-center text-gray-500"
            tabIndex={-1}
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
        {formErrors.VC_Pwd && <p className="mt-1 text-sm text-red-500">{formErrors.VC_Pwd}</p>}

        {/* Password strength meter */}
        <div className="mt-2 space-y-1">
          <div className="h-2 w-full rounded bg-gray-200">
            <div
              className={`h-2 rounded transition-all ${
                passwordStrength.passed <= 2
                  ? 'w-1/4 bg-red-500'
                  : passwordStrength.passed === 3
                  ? 'w-1/2 bg-yellow-500'
                  : passwordStrength.passed === 4
                  ? 'w-3/4 bg-blue-500'
                  : 'w-full bg-green-500'
              }`}
            />
          </div>
          <div className="text-xs text-gray-500">
            Strength: {passwordStrength.passed}/{passwordStrength.total}
          </div>
        </div>
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
          <CheckCircleIcon className="h-5 w-5" /> User created successfully!
        </div>
      )}
    </form>
  )
}