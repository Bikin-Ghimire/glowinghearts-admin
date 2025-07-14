'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Logo } from '@/app/logo'
import { Button } from '@/components/button'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Strong, Text, TextLink } from '@/components/text'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ Set cookie BEFORE calling signIn, so backend sees it during authorize()
    document.cookie = `rememberMeForward=${remember}; path=/`
    
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/',
    })

    if (res?.ok) {
      // Save preference in localStorage so middleware or backend can read it (optional)
      if (remember) {
        document.cookie = 'rememberMeForward=true; path=/'
      } else {
        document.cookie = 'rememberMeForward=false; path=/'
      }

      router.push(res.url || '/')
    } else {
      alert('Invalid email or password')
    }
  }

  return (
    <form onSubmit={handleLogin} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <Logo className="h-6 text-zinc-950 dark:text-white" />
      <Heading>Sign in to your account</Heading>
      <Field>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field>
        <Label>Password</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      <div className="flex items-center justify-between">
        <CheckboxField>
          <Checkbox
            checked={remember}
            onChange={(checked: boolean) => setRemember(checked)}
            name="remember"
          />
          <Label>Remember me</Label>
        </CheckboxField>
        <Text>
          <TextLink href="/forgot-password">
            <Strong>Forgot password?</Strong>
          </TextLink>
        </Text>
      </div>
      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  )
}