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
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(8, {
    message: "Your password was more secure than 8 characters."
  })
})

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const handleLogin = async (e: React.FormEvent) => {
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
          className="h-70 w-auto mx-auto"
        />
        <Card className="w-full max-w-sm p-4 shadow-lg">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome Back!</h2>
            <p className="text-l mb-4 text-center">Enter your email below to login to your account</p>
            <Form {...form}>
              <form onSubmit={handleLogin} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <a href="/ForgotPassword" className="underline underline-offset-4">Forgot Password?</a>
                <Button type="submit" className="w-full" variant="secondary">Login</Button>
                <p>Don't have an account? <a href="/SignUp" className="underline underline-offset-4">Sign up</a></p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}