'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useSite, usePages, useReverseSilos, useCreateReverseSilo, useFinalizeSilo } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft,
  Target,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  GripVertical,
  Save,
  Lock,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { ReverseSilo, SupportingPage, ValidationRule } from '@/lib/types'
import { useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'

function ValidationSidebar({ 
  validationStatus, 
  isValid 
}: { 
  validationStatus: { rules: ValidationRule[]; blockReason?: string }
  isValid: boolean 
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Validation Status</CardTitle>
        <CardDescription>
          Real-time governance checks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          isValid 
            ? 'bg-green-50 dark:bg-green-950' 
            : 'bg-red-50 dark:bg-red-950'
        }`}>
          {isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={`font-medium ${
            isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {isValid ? 'Valid' : 'Invalid'}
          </span>
        </div>

        <div className="space-y-2">
          {validationStatus.rules.map((rule, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 rounded"
            >
              {rule.passed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{rule.name}</p>
                {rule.message && (
                  <p className="text-xs text-muted-foreground">{rule.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {validationStatus.blockReason && !isValid && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Block Reason
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {validationStatus.blockReason}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function VisualFunnel({ 
  targetPage, 
  supportingPages 
}: { 
  targetPage?: { title: string; keyword: string }
  supportingPages: SupportingPage[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual Funnel</CardTitle>
        <CardDescription>
          Silo architecture visualization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Target Page */}
          {targetPage && (
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-lg p-4 w-full max-w-md text-center">
                <Target className="h-6 w-6 mx-auto mb-2" />
                <h3 className="font-semibold">{targetPage.title}</h3>
                <p className="text-sm opacity-90">{targetPage.keyword}</p>
                <Badge variant="secondary" className="mt-2">Target (King)</Badge>
              </div>
            </div>
          )}

          {/* Supporting Pages */}
          {supportingPages.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              {supportingPages.map((page, index) => (
                <div key={page.id || index} className="flex items-center gap-4 w-full max-w-md">
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{page.title}</h4>
                        <p className="text-xs text-muted-foreground">{page.keyword}</p>
                      </div>
                      <Badge variant="outline">Supporting</Badge>
                    </div>
                  </div>
                  <div className="text-muted-foreground">↑</div>
                </div>
              ))}
            </div>
          )}

          {!targetPage && supportingPages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Configure your silo to see the visualization</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReverseSiloPlannerPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const { data: site } = useSite(siteId)
  const { data: pages } = usePages(siteId)
  const queryClient = useQueryClient()
  
  const [targetPageId, setTargetPageId] = useState<string>('')
  const [primaryKeyword, setPrimaryKeyword] = useState('')
  const [intent, setIntent] = useState<'commercial' | 'informational'>('commercial')
  const [entities, setEntities] = useState<string[]>([])
  const [entityInput, setEntityInput] = useState('')
  const [supportingPages, setSupportingPages] = useState<SupportingPage[]>([])
  const [newSupportingTitle, setNewSupportingTitle] = useState('')
  const [newSupportingKeyword, setNewSupportingKeyword] = useState('')

  const createSilo = useCreateReverseSilo()
  const finalizeSilo = useFinalizeSilo()

  // Mock validation - in real app, this would come from API
  const validationStatus = {
    rules: [
      {
        name: 'Minimum 3 supporting pages',
        passed: supportingPages.length >= 3,
        message: supportingPages.length < 3 
          ? `Need ${3 - supportingPages.length} more page(s)`
          : undefined
      },
      {
        name: 'Maximum 7 supporting pages',
        passed: supportingPages.length <= 7,
        message: supportingPages.length > 7
          ? `Remove ${supportingPages.length - 7} page(s)`
          : undefined
      },
      {
        name: 'No keyword conflicts',
        passed: true, // Would check against existing pages
        message: undefined
      },
      {
        name: 'All entities covered',
        passed: entities.length >= 3 && entities.length <= 5,
        message: entities.length < 3 
          ? 'Need at least 3 entities'
          : entities.length > 5
          ? 'Maximum 5 entities allowed'
          : undefined
      },
      {
        name: 'Proper link structure',
        passed: targetPageId !== '',
        message: targetPageId === '' ? 'Target page required' : undefined
      }
    ],
    blockReason: undefined
  }

  const isValid = validationStatus.rules.every(r => r.passed)

  const handleAddEntity = () => {
    if (entityInput.trim() && !entities.includes(entityInput.trim())) {
      setEntities([...entities, entityInput.trim()])
      setEntityInput('')
    }
  }

  const handleRemoveEntity = (entity: string) => {
    setEntities(entities.filter(e => e !== entity))
  }

  const handleAddSupportingPage = () => {
    if (newSupportingTitle.trim() && newSupportingKeyword.trim()) {
      const newPage: SupportingPage = {
        id: `temp-${Date.now()}`,
        title: newSupportingTitle.trim(),
        keyword: newSupportingKeyword.trim(),
        order: supportingPages.length + 1
      }
      setSupportingPages([...supportingPages, newPage])
      setNewSupportingTitle('')
      setNewSupportingKeyword('')
    }
  }

  const handleRemoveSupportingPage = (id: string) => {
    setSupportingPages(supportingPages.filter(p => p.id !== id))
  }

  const handleSaveDraft = async () => {
    if (!targetPageId || !primaryKeyword) return

    try {
      await createSilo.mutateAsync({
        siteId,
        targetPageId,
        primaryKeyword,
        intent,
        entities,
        supportingPages,
        status: 'draft',
        is_valid: false,
        validationStatus
      })
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  const handleFinalize = async () => {
    if (!isValid) {
      alert('Cannot finalize: Validation failed. Please fix all issues.')
      return
    }

    // In real app, we'd get the silo ID from the saved draft
    try {
      // This would use the actual silo ID
      // await finalizeSilo.mutateAsync(siloId)
      alert('Silo finalized! This would trigger the finalization API call.')
    } catch (error) {
      console.error('Failed to finalize silo:', error)
    }
  }

  const targetPage = pages?.find(p => p.id === targetPageId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/sites/${siteId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Reverse Silo Planner</h1>
          <p className="text-muted-foreground mt-1">
            Plan and visualize your silo architecture
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Page Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Page Setup
              </CardTitle>
              <CardDescription>
                Configure the King page for this silo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-page">Target Page (King)</Label>
                <Select value={targetPageId} onValueChange={setTargetPageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select or create target page" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages?.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-keyword">Primary Keyword *</Label>
                <Input
                  id="primary-keyword"
                  placeholder="Enter unique primary keyword"
                  value={primaryKeyword}
                  onChange={(e) => setPrimaryKeyword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This keyword must be unique across all pages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intent">Intent</Label>
                <Select value={intent} onValueChange={(v: 'commercial' | 'informational') => setIntent(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="informational">Informational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entities (3-5 required)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add entity"
                    value={entityInput}
                    onChange={(e) => setEntityInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddEntity()
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    onClick={handleAddEntity}
                    disabled={!entityInput.trim() || entities.length >= 5}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.map((entity) => (
                    <Badge key={entity} variant="secondary" className="flex items-center gap-1">
                      {entity}
                      <button
                        onClick={() => handleRemoveEntity(entity)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entities.length}/5 entities added
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Supporting Pages
              </CardTitle>
              <CardDescription>
                Add 3-7 supporting pages that link to the target
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Add Supporting Page</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Page title"
                    value={newSupportingTitle}
                    onChange={(e) => setNewSupportingTitle(e.target.value)}
                  />
                  <Input
                    placeholder="Keyword"
                    value={newSupportingKeyword}
                    onChange={(e) => setNewSupportingKeyword(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSupportingPage}
                  disabled={!newSupportingTitle.trim() || !newSupportingKeyword.trim() || supportingPages.length >= 7}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supporting Page
                </Button>
              </div>

              <div className="space-y-2">
                {supportingPages.map((page, index) => (
                  <div
                    key={page.id || index}
                    className="flex items-center gap-2 p-3 border rounded-lg"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{page.title}</p>
                      <p className="text-xs text-muted-foreground">{page.keyword}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSupportingPage(page.id || `temp-${index}`)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                {supportingPages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No supporting pages added yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visual Funnel */}
          <VisualFunnel
            targetPage={targetPage ? { title: targetPage.title, keyword: primaryKeyword } : undefined}
            supportingPages={supportingPages}
          />
        </div>

        {/* Validation Sidebar */}
        <div>
          <ValidationSidebar validationStatus={validationStatus} isValid={isValid} />

          {/* Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSaveDraft}
                disabled={!targetPageId || !primaryKeyword}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                className="w-full"
                onClick={handleFinalize}
                disabled={!isValid}
              >
                <Lock className="h-4 w-4 mr-2" />
                Finalize Silo
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={supportingPages.length === 0}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Content
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
