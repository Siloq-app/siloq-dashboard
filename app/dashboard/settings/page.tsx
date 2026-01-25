'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, Users, Key, Bell, Save, CheckCircle2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import apiClient from '@/lib/api-client'

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({ name: '', email: '' })
  const [agentSettings, setAgentSettings] = useState({ 
    autonomyLevel: 'Manual Approval Required',
    approvalWorkflow: 'Single Approver'
  })
  const [notifications, setNotifications] = useState({
    email: true,
    jobCompletion: true,
    governanceViolations: true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await apiClient.put('/user/profile', profileData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAgentSettings = async () => {
    setIsSaving(true)
    try {
      await apiClient.put('/user/agent-settings', agentSettings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save agent settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      await apiClient.put('/user/notifications', notifications)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save notifications:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          User and workspace configuration
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="agent">Agent Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your name" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="transition-all duration-200"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage team members and roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Invite Team Members</p>
                  <p className="text-sm text-muted-foreground">
                    Add users with different permission levels
                  </p>
                </div>
                <Button>Invite User</Button>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Roles</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Owner: Full access to all features</li>
                  <li>• Manager: Can manage sites and content</li>
                  <li>• Writer: Can create and edit content</li>
                  <li>• Viewer: Read-only access</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent" className="space-y-4 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Agent Permissions
              </CardTitle>
              <CardDescription>
                Configure AI agent autonomy levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Autonomy Level</Label>
                <select 
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors"
                  value={agentSettings.autonomyLevel}
                  onChange={(e) => setAgentSettings({ ...agentSettings, autonomyLevel: e.target.value })}
                >
                  <option>Manual Approval Required</option>
                  <option>Auto-approve Low Risk</option>
                  <option>Full Autonomy</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Approval Workflow</Label>
                <select 
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors"
                  value={agentSettings.approvalWorkflow}
                  onChange={(e) => setAgentSettings({ ...agentSettings, approvalWorkflow: e.target.value })}
                >
                  <option>Single Approver</option>
                  <option>Multiple Approvers</option>
                </select>
              </div>
              <Button 
                onClick={handleSaveAgentSettings}
                disabled={isSaving}
                className="transition-all duration-200"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.email}
                  onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Job Completion Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Notify when content jobs complete
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.jobCompletion}
                  onChange={(e) => setNotifications({ ...notifications, jobCompletion: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">Governance Violations</p>
                  <p className="text-sm text-muted-foreground">
                    Alert on compliance issues
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.governanceViolations}
                  onChange={(e) => setNotifications({ ...notifications, governanceViolations: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <Button 
                onClick={handleSaveNotifications}
                disabled={isSaving}
                className="transition-all duration-200"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
