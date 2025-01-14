'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import Link from 'next/link'
import { login } from '@/app/login/actions'
import { LoaderCircle } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required')
})

type FormValues = z.infer<typeof formSchema>

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await login(values.email, values.password)
      if (result?.message) {
        throw new Error(result.message)
      }
      router.push('/client')
    } catch (error: any) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader className="pb-4">
        <CardTitle>Login</CardTitle>
        <CardDescription>Welcome back to pChat</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="grid w-full items-center gap-2.5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password" 
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={isLoading}>
              Login
              {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
            </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <p className="mt-4 text-sm text-center">
              Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
