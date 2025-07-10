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
import { useNavigate } from 'react-router-dom';



const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(8, {
    message: "Your password was more secure than 8 characters."
  })
})

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("")
  

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Hook into your backend POST /api/auth/login
    console.log({ email })
  }

  // const handleCancelClick = {
  //   try {
  //     navigate("/login");
  //   } catch (err) {
  //     console.error("Navigation failed:", err);
  //   }
  // }

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
            <h2 className="text-2xl font-bold mb-4 text-center">Let's help you out</h2>
            <p className="text-l mb-4 text-center">Enter the email associated with your account</p>
            <Form {...form}>
              <form onSubmit={handlePasswordReset} className="space-y-4">
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
                <Button type="submit" className="w-full" variant="default">Reset Password</Button>
                <Button type="button" className="w-full" variant="outline">Cancel</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}