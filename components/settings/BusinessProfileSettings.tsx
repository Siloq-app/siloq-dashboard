'use client';

import { useState, useEffect, useCallback } from 'react';
import { entityProfileService, EntityProfile } from '@/lib/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface Props {
  siteId: number | string;
}

export default function BusinessProfileSettings({ siteId }: Props) {
  const [profile, setProfile] = useState<EntityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gbpInput, setGbpInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [syncMode, setSyncMode] = useState<'url' | 'phone'>('url');
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [citiesRaw, setCitiesRaw] = useState('');

  const load = useCallback(async () => {
    try {
      const p = await entityProfileService.get(siteId);
      setProfile(p);
      setGbpInput(p.gbp_url || p.google_place_id || '');
    } catch {
      setError('Failed to load business profile');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  // Sync citiesRaw display string whenever profile.service_cities changes externally
  // (e.g. after GBP sync). Don't override if user is actively editing — the onBlur
  // handler writes back to profile, so a profile change = external update.
  useEffect(() => {
    if (profile?.service_cities) {
      setCitiesRaw(profile.service_cities.join(', '));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.service_cities]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      await entityProfileService.update(siteId, profile);
      // Reload from API after save to guarantee we display what's actually persisted
      const refreshed = await entityProfileService.get(siteId);
      setProfile(refreshed);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewGbp = async () => {
    const input = syncMode === 'phone' ? phoneInput.trim() : gbpInput.trim();
    if (!input) return;

    setPreviewLoading(true);
    setSyncError(null);
    try {
      const preview = await entityProfileService.previewGbp(siteId, input);
      setConfirmationData(preview);
      setShowConfirmation(true);
    } catch (e: any) {
      setSyncError(e.message || 'Failed to preview business data');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmSync = async () => {
    if (!confirmationData) return;
    setSaving(true);
    setError(null);
    try {
      // Actually save the confirmed data
      const updated = await entityProfileService.syncGbp(
        siteId,
        syncMode === 'phone' ? phoneInput.trim() : gbpInput.trim()
      );
      setProfile(updated);
      setShowConfirmation(false);
      setConfirmationData(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationData(null);
  };

  const set = (field: keyof EntityProfile, value: any) =>
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));

  const setSocial = (platform: string, value: string) =>
    setProfile((prev) =>
      prev ? { ...prev, social_profiles: { ...prev.social_profiles, [platform]: value } } : prev
    );

  if (loading) return <div className="p-6 text-slate-500">Loading business profile...</div>;
  if (!profile) return <div className="p-6 text-red-500">{error || 'Failed to load'}</div>;

  return (
    <div className="max-w-2xl space-y-8 p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Business Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          This data powers schema generation across all your pages. Keep it accurate.
        </p>
      </div>

      {/* GBP Sync */}
      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div>
          <h3 className="font-medium text-blue-900">Google Business Profile</h3>
          <p className="mt-1 text-xs text-blue-700">
            Sync your business info and pull real customer reviews from Google.
          </p>
        </div>

        {/* Sync Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSyncMode('url')}
            className={`rounded px-3 py-1.5 text-xs font-medium ${syncMode === 'url' ? 'bg-blue-600 text-white' : 'border border-blue-200 bg-white text-blue-600'}`}
          >
            Place ID / URL
          </button>
          <button
            onClick={() => setSyncMode('phone')}
            className={`rounded px-3 py-1.5 text-xs font-medium ${syncMode === 'phone' ? 'bg-blue-600 text-white' : 'border border-blue-200 bg-white text-blue-600'}`}
          >
            Find by phone
          </button>
        </div>

        {/* URL/Place ID Input */}
        {syncMode === 'url' && (
          <div className="flex gap-2">
            <Input
              value={gbpInput}
              onChange={(e) => setGbpInput(e.target.value)}
              placeholder="https://maps.google.com/?cid=... or ChIJ..."
              className="flex-1 text-sm"
            />
            <Button
              onClick={handlePreviewGbp}
              disabled={previewLoading || !gbpInput.trim()}
              size="sm"
            >
              {previewLoading ? 'Loading...' : 'Preview'}
            </Button>
          </div>
        )}

        {/* Phone Input */}
        {syncMode === 'phone' && (
          <div className="flex gap-2">
            <Input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+1 (816) 555-0123"
              className="flex-1 text-sm"
            />
            <Button
              onClick={handlePreviewGbp}
              disabled={previewLoading || !phoneInput.trim()}
              size="sm"
            >
              {previewLoading ? 'Searching...' : 'Find Business'}
            </Button>
          </div>
        )}

        {profile.gbp_last_synced && !syncError && (
          <p className="text-xs text-blue-600">
            Last synced: {new Date(profile.gbp_last_synced).toLocaleString()} ·{' '}
            {profile.gbp_review_count} reviews · {profile.gbp_star_rating}★
          </p>
        )}
        {syncError && (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <p className="font-medium">⚠️ {syncError}</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && confirmationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="mx-4 w-full max-w-md space-y-4 p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Is this your business?</h3>
              <div className="mt-3 space-y-2">
                <p className="font-medium text-gray-900">{confirmationData.business_name}</p>
                <p className="text-gray-600">
                  {confirmationData.city}, {confirmationData.state}
                </p>
                <p className="text-sm text-gray-500">
                  ⭐ {confirmationData.gbp_star_rating} · {confirmationData.gbp_review_count}{' '}
                  reviews
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleConfirmSync} disabled={saving} className="flex-1">
                {saving ? 'Connecting...' : 'Yes, connect this business'}
              </Button>
              <Button
                onClick={handleCancelConfirmation}
                variant="outline"
                disabled={saving}
                className="flex-1"
              >
                No, try again
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Core Info */}
      <div className="space-y-4">
        <h3 className="border-b pb-2 font-medium text-slate-800">Business Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Business Name</Label>
            <Input
              value={profile.business_name}
              onChange={(e) => set('business_name', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <textarea
              value={profile.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={profile.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <Label>Founder Name</Label>
            <Input
              value={profile.founder_name}
              onChange={(e) => set('founder_name', e.target.value)}
            />
          </div>
          <div>
            <Label>Founded Year</Label>
            <Input
              type="number"
              value={profile.founding_year || ''}
              onChange={(e) => set('founding_year', parseInt(e.target.value) || null)}
            />
          </div>
          <div>
            <Label>Price Range</Label>
            <Input
              value={profile.price_range}
              placeholder="$$"
              onChange={(e) => set('price_range', e.target.value)}
            />
          </div>
          <div>
            <Label>Team Size</Label>
            <Input
              value={profile.num_employees}
              placeholder="10-50"
              onChange={(e) => set('num_employees', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="border-b pb-2 font-medium text-slate-800">Address</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Street Address</Label>
            <Input
              value={profile.street_address}
              onChange={(e) => set('street_address', e.target.value)}
            />
          </div>
          <div>
            <Label>City</Label>
            <Input value={profile.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <Label>State</Label>
            <Input value={profile.state} onChange={(e) => set('state', e.target.value)} />
          </div>
          <div>
            <Label>ZIP Code</Label>
            <Input value={profile.zip_code} onChange={(e) => set('zip_code', e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={profile.country} onChange={(e) => set('country', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Service Area */}
      <div className="space-y-4">
        <h3 className="border-b pb-2 font-medium text-slate-800">Service Area</h3>
        <div>
          <Label>Cities Served (comma-separated)</Label>
          <Input
            value={citiesRaw}
            onChange={(e) => setCitiesRaw(e.target.value)}
            onBlur={(e) =>
              set(
                'service_cities',
                e.target.value
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter((s) => s !== '')
              )
            }
            placeholder="Kansas City, Lee's Summit, Blue Springs"
          />
        </div>
        <div>
          <Label>Service Radius (miles)</Label>
          <Input
            type="number"
            value={profile.service_radius_miles || ''}
            onChange={(e) => set('service_radius_miles', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      {/* Social Profiles */}
      <div className="space-y-4">
        <h3 className="border-b pb-2 font-medium text-slate-800">
          Social Profiles{' '}
          <span className="text-xs font-normal text-slate-500">
            (used in Organization schema sameAs)
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {(['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok'] as const).map(
            (platform) => (
              <div key={platform}>
                <Label className="capitalize">{platform}</Label>
                <Input
                  value={profile.social_profiles[platform]}
                  onChange={(e) => setSocial(platform, e.target.value)}
                  placeholder={`https://${platform}.com/...`}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* GBP Reviews preview — 4 & 5 star only */}
      {profile.gbp_reviews.filter((r) => r.rating >= 4).length > 0 && (
        <div className="space-y-3">
          <h3 className="border-b pb-2 font-medium text-slate-800">
            Google Reviews ({profile.gbp_review_count} total · showing 4★ &amp; 5★ only)
          </h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {profile.gbp_reviews
              .filter((r) => r.rating >= 4)
              .slice(0, 5)
              .map((r, i) => (
                <div key={i} className="rounded bg-slate-50 p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-slate-700">{r.author}</span>
                    <span className="text-yellow-500">{'★'.repeat(r.rating)}</span>
                    <span className="text-xs text-slate-400">{r.date}</span>
                  </div>
                  <p className="line-clamp-2 text-slate-600">{r.text}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Business Profile'}
        </Button>
        {saved && <span className="text-sm text-green-600">✅ Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
