"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BILLING_ENDPOINTS } from "@/lib/backend-api"

interface SubscriptionStatus {
  status: string
  tier: string | null
  trial_ends_at?: string
  days_remaining?: number
  current_period_end?: number
  cancel_at_period_end?: boolean
}

export default function BillingPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(BILLING_ENDPOINTS.status(), {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error)
    } finally {
      setLoading(false)
    }
  }

  const openCustomerPortal = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch(BILLING_ENDPOINTS.portal(), {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.portal_url) {
          window.location.href = data.portal_url
        }
      } else {
        const error = await response.json()
        alert(error.error || "Failed to open billing portal")
      }
    } catch (error) {
      console.error("Portal error:", error)
    } finally {
      setPortalLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      trial: { variant: "secondary", label: "Trial" },
      active: { variant: "default", label: "Active" },
      past_due: { variant: "destructive", label: "Past Due" },
      canceled: { variant: "outline", label: "Canceled" },
      inactive: { variant: "outline", label: "Inactive" },
    }
    const config = variants[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTierName = (tier: string | null) => {
    const names: Record<string, string> = {
      pro: "Pro",
      builder: "Builder+",
      architect: "Architect",
      empire: "Empire",
      trial: "Free Trial",
    }
    return tier ? names[tier] || tier : "None"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-slate-400">Manage your subscription and billing settings</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Status</span>
            {subscription && getStatusBadge(subscription.status)}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Plan</span>
            <span className="text-white font-medium">
              {getTierName(subscription?.tier || (subscription?.status === "trial" ? "trial" : null))}
            </span>
          </div>

          {subscription?.status === "trial" && subscription.days_remaining !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Trial ends in</span>
              <span className="text-white">{subscription.days_remaining} days</span>
            </div>
          )}

          {subscription?.current_period_end && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current period ends</span>
              <span className="text-white">
                {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
              </span>
            </div>
          )}

          {subscription?.cancel_at_period_end && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-500 text-sm">
                Your subscription will cancel at the end of the current billing period.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        {subscription?.status === "active" && (
          <Button
            onClick={openCustomerPortal}
            disabled={portalLoading}
            className="bg-slate-700 hover:bg-slate-600"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Manage Subscription
          </Button>
        )}

        {(subscription?.status === "inactive" || subscription?.status === "trial" || subscription?.status === "canceled") && (
          <Button
            onClick={() => router.push("/pricing")}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            {subscription?.status === "trial" ? "Upgrade Now" : "Choose a Plan"}
          </Button>
        )}
      </div>
    </div>
  )
}
