import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden bg-yellow-50" />
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  )
}
