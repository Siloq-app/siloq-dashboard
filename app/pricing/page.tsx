"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BILLING_ENDPOINTS, AUTH_ENDPOINTS } from "@/lib/backend-api"

const tiers = [
  {
    name: "Pro",
    id: "pro",
    price: "$199",
    description: "For growing businesses ready to optimize their SEO.",
    features: [
      "1 website",
      "2 silos",
      "Unlimited content generation",
      "Cannibalization detection",
      "Basic support",
    ],
    cta: "Start Pro",
    popular: false,
  },
  {
    name: "Builder+",
    id: "builder",
    price: "$399",
    description: "For serious businesses scaling their content strategy.",
    features: [
      "1 website",
      "Unlimited silos",
      "Unlimited content generation",
      "All automation modes",
      "Priority support",
    ],
    cta: "Start Builder+",
    popular: true,
  },
  {
    name: "Architect",
    id: "architect",
    price: "$799",
    description: "For agencies and multi-site operations.",
    features: [
      "5 websites",
      "Unlimited silos",
      "Unlimited content generation",
      "All automation modes",
      "Priority support",
      "Team collaboration",
    ],
    cta: "Start Architect",
    popular: false,
  },
  {
    name: "Empire",
    id: "empire",
    price: "$1,999",
    description: "For enterprise-scale SEO operations.",
    features: [
      "20 websites",
      "Unlimited everything",
      "White-glove onboarding",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Start Empire",
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const response = await fetch(AUTH_ENDPOINTS.me(), {
        credentials: "include",
      })
      setIsAuthenticated(response.ok)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleCheckout = async (tierId: string) => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/pricing&plan=${tierId}`)
      return
    }

    setLoading(tierId)
    try {
      const response = await fetch(BILLING_ENDPOINTS.checkout(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ tier: tierId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || error.error || "Checkout failed")
      }

      const data = await response.json()
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert(error instanceof Error ? error.message : "Failed to start checkout")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Auth Banner */}
        {!checkingAuth && !isAuthenticated && (
          <div className="mb-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogIn className="h-5 w-5 text-indigo-400" />
              <span className="text-slate-300">
                Sign in or create an account to start your free trial
              </span>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-indigo-500 hover:bg-indigo-600">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-300">
            Start with a 10-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative flex flex-col ${
                tier.popular
                  ? "border-indigo-500 border-2 shadow-lg shadow-indigo-500/20"
                  : "border-slate-700"
              } bg-slate-800/50 backdrop-blur`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-white">{tier.name}</CardTitle>
                <CardDescription className="text-slate-400">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${
                    tier.popular
                      ? "bg-indigo-500 hover:bg-indigo-600"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  onClick={() => handleCheckout(tier.id)}
                  disabled={loading !== null || checkingAuth}
                >
                  {loading === tier.id ? "Loading..." : 
                   !isAuthenticated ? `Sign up for ${tier.name}` : tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-slate-400">
          <p>All plans include a 10-day free trial. Cancel anytime.</p>
          <p className="mt-2">
            Questions?{" "}
            <a href="mailto:support@siloq.ai" className="text-indigo-400 hover:text-indigo-300">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
