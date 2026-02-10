'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, Store, FileText, Code, HelpCircle,
  ChevronRight, ChevronLeft, Check, X, Plus, Trash2,
  Loader2, Sparkles, MapPin
} from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { sitesService, BusinessProfile } from '@/lib/services/api'

interface Props {
  siteId: number | string
  onComplete: () => void
  onSkip?: () => void
}

const BUSINESS_TYPES = [
  { 
    value: 'local_service', 
    label: 'Local/Service Business',
    description: 'Plumbers, lawyers, dentists, contractors, etc.',
    icon: Building2,
  },
  { 
    value: 'ecommerce', 
    label: 'E-Commerce',
    description: 'Online stores selling physical or digital products',
    icon: Store,
  },
  { 
    value: 'content_blog', 
    label: 'Content/Blog',
    description: 'Media sites, blogs, news, affiliate sites',
    icon: FileText,
  },
  { 
    value: 'saas', 
    label: 'SaaS/Software',
    description: 'Software companies, apps, digital tools',
    icon: Code,
  },
  { 
    value: 'other', 
    label: 'Other',
    description: 'Doesn\'t fit the above categories',
    icon: HelpCircle,
  },
]

export default function OnboardingWizard({ siteId, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [businessType, setBusinessType] = useState<string | null>(null)
  const [services, setServices] = useState<string[]>([])
  const [newService, setNewService] = useState('')
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [newArea, setNewArea] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')

  // Load existing profile
  useEffect(() => {
    loadProfile()
  }, [siteId])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const profile = await sitesService.getProfile(siteId)
      if (profile.business_type) setBusinessType(profile.business_type)
      if (profile.primary_services?.length) setServices(profile.primary_services)
      if (profile.service_areas?.length) setServiceAreas(profile.service_areas)
      if (profile.target_audience) setTargetAudience(profile.target_audience)
      if (profile.business_description) setBusinessDescription(profile.business_description)
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()])
      setNewService('')
    }
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const addArea = () => {
    if (newArea.trim() && !serviceAreas.includes(newArea.trim())) {
      setServiceAreas([...serviceAreas, newArea.trim()])
      setNewArea('')
    }
  }

  const removeArea = (index: number) => {
    setServiceAreas(serviceAreas.filter((_, i) => i !== index))
  }

  const handleNext = async () => {
    // Save progress at each step
    setIsSaving(true)
    try {
      await sitesService.updateProfile(siteId, {
        business_type: businessType,
        primary_services: services,
        service_areas: serviceAreas,
        target_audience: targetAudience,
        business_description: businessDescription,
      })
      
      if (step < totalSteps) {
        setStep(step + 1)
      } else {
        onComplete()
      }
    } catch (e) {
      console.error('Failed to save profile:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const isLocalBusiness = businessType === 'local_service'
  const totalSteps = isLocalBusiness ? 4 : 3

  const canProceed = () => {
    switch (step) {
      case 1: return !!businessType
      case 2: return services.length > 0
      case 3: 
        if (isLocalBusiness) return serviceAreas.length > 0
        return true // Review step
      case 4: return true // Review step
      default: return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                i + 1 < step 
                  ? 'bg-green-500 text-white' 
                  : i + 1 === step 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
          ))}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {/* Step 1: Business Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">What type of business is this?</h2>
              <p className="text-muted-foreground mt-1">
                This helps Siloq suggest the best content structure for your site.
              </p>
            </div>
            
            <div className="grid gap-3">
              {BUSINESS_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setBusinessType(type.value)}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-colors ${
                      businessType === type.value
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-border hover:border-amber-500/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      businessType === type.value ? 'bg-amber-500 text-white' : 'bg-muted'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Services/Products */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">
                {businessType === 'ecommerce' ? 'What products do you sell?' : 'What services do you offer?'}
              </h2>
              <p className="text-muted-foreground mt-1">
                Enter your main {businessType === 'ecommerce' ? 'product categories' : 'services'}. 
                Siloq will build content silos around each one.
              </p>
            </div>

            {/* Add Service Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                placeholder={businessType === 'ecommerce' ? 'e.g., Running Shoes' : 'e.g., SEO Services'}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Button onClick={addService} disabled={!newService.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Services List */}
            <div className="space-y-2">
              {services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Add at least one {businessType === 'ecommerce' ? 'product' : 'service'} to continue
                </div>
              ) : (
                services.map((service, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span>{service}</span>
                    <button
                      onClick={() => removeService(index)}
                      className="p-1 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {services.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 inline mr-1 text-amber-500" />
                Siloq will create a target page and 6 supporting content ideas for each {businessType === 'ecommerce' ? 'product' : 'service'}.
              </div>
            )}
          </div>
        )}

        {/* Step 3: Service Areas (Local Business Only) */}
        {step === 3 && isLocalBusiness && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Where do you serve?</h2>
              <p className="text-muted-foreground mt-1">
                Enter the cities, neighborhoods, or areas you serve. 
                Siloq will suggest location-specific pages.
              </p>
            </div>

            {/* Add Area Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
                placeholder="e.g., Kansas City, MO"
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Button onClick={addArea} disabled={!newArea.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Areas List */}
            <div className="flex flex-wrap gap-2">
              {serviceAreas.length === 0 ? (
                <div className="w-full text-center py-8 text-muted-foreground">
                  Add at least one service area to continue
                </div>
              ) : (
                serviceAreas.map((area, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full"
                  >
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span>{area}</span>
                    <button
                      onClick={() => removeArea(index)}
                      className="p-0.5 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {serviceAreas.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 inline mr-1 text-amber-500" />
                Siloq will suggest "{services[0] || 'Service'} in {serviceAreas[0]}" pages for local SEO.
              </div>
            )}
          </div>
        )}

        {/* Review Step */}
        {((step === 3 && !isLocalBusiness) || step === 4) && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Review Your Profile</h2>
              <p className="text-muted-foreground mt-1">
                Confirm your business details before generating your content strategy.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Business Type</div>
                <div className="font-medium">
                  {BUSINESS_TYPES.find(t => t.value === businessType)?.label || businessType}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  {businessType === 'ecommerce' ? 'Products' : 'Services'} ({services.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.map((service, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {isLocalBusiness && serviceAreas.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">
                    Service Areas ({serviceAreas.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {serviceAreas.map((area, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-green-600">Ready to Generate!</div>
                  <div className="text-sm text-muted-foreground">
                    Siloq will create {services.length} target pages with {services.length * 6} supporting content suggestions
                    {isLocalBusiness && serviceAreas.length > 0 && ` plus ${serviceAreas.length} location pages`}.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <div>
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : onSkip ? (
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            ) : null}
          </div>
          
          <Button 
            onClick={handleNext} 
            disabled={!canProceed() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : step === totalSteps ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            {step === totalSteps ? 'Complete Setup' : 'Continue'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
