// src/pages/Login.tsx
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"



const FormSchema = z.object({
	firstName: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
	lastName: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().min(2, {
    message: "email must be at least 2 characters.",
  }),
  password: z.string().min(8, {
    message: "Your password was more secure than 8 characters."
  })
})

export default function SignUp() {
  const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Hook into your backend POST /api/auth/login
    console.log({ email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="mb-6">
        <img
          src="/logo-transparent.png"
          alt="App Logo"
          className="h-50 w-auto mx-auto"
        />
        <Card className="w-full max-w-sm p-4 shadow-lg">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome Back!</h2>
            <p className="text-l mb-4 text-center">Enter your email below to login to your account</p>
            <Form {...form}>
              <form onSubmit={handleSignUp} className="space-y-4">
							<FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          id="firstName"
                          type="firstName"
                          placeholder="Work"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
								<FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          id="lastName"
                          type="lastName"
                          placeholder="Buddy"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
								<FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="buddy@workbuddy.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
											<FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" variant="secondary">Signup</Button>
                <p>Already have an account? <a href="/Login" className="underline underline-offset-4">Login</a></p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}