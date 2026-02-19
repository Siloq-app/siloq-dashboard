'use client';

import { useState, useEffect, useCallback } from 'react';
import { entityProfileService, EntityProfile } from '@/lib/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props { siteId: number | string; }

export default function BusinessProfileSettings({ siteId }: Props) {
  const [profile, setProfile] = useState<EntityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [gbpInput, setGbpInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [needsPlaceId, setNeedsPlaceId] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await entityProfileService.get(siteId);
      setProfile(p);
      setGbpInput(p.gbp_url || p.google_place_id || '');
    } catch { setError('Failed to load business profile'); }
    finally { setLoading(false); }
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true); setError(null);
    try {
      const updated = await entityProfileService.update(siteId, profile);
      setProfile(updated); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleSyncGbp = async () => {
    if (!gbpInput.trim()) return;
    setSyncing(true); setSyncError(null); setNeedsPlaceId(false);
    try {
      const updated = await entityProfileService.syncGbp(siteId, gbpInput.trim());
      setProfile(updated);
      setSyncError(null);
    } catch (e: any) {
      const msg: string = e.message || 'Sync failed';
      setSyncError(msg);
      // Backend signals when a Place ID is needed instead of a URL
      if (msg.includes('Place ID') || msg.includes('place_id') || msg.includes("Couldn't find")) {
        setNeedsPlaceId(true);
      }
    }
    finally { setSyncing(false); }
  };

  const set = (field: keyof EntityProfile, value: any) =>
    setProfile(prev => prev ? { ...prev, [field]: value } : prev);

  const setSocial = (platform: string, value: string) =>
    setProfile(prev => prev ? { ...prev, social_profiles: { ...prev.social_profiles, [platform]: value } } : prev);

  if (loading) return <div className="p-6 text-slate-500">Loading business profile...</div>;
  if (!profile) return <div className="p-6 text-red-500">{error || 'Failed to load'}</div>;

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Business Profile</h2>
        <p className="text-sm text-slate-500 mt-1">This data powers schema generation across all your pages. Keep it accurate.</p>
      </div>

      {/* GBP Sync */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <div>
          <h3 className="font-medium text-blue-900">Google Business Profile</h3>
          <p className="text-xs text-blue-700 mt-1">Paste your GBP URL or Place ID to auto-fill business info and pull real customer reviews.</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={gbpInput}
            onChange={e => setGbpInput(e.target.value)}
            placeholder="https://maps.google.com/?cid=... or ChIJ..."
            className="flex-1 text-sm"
          />
          <Button onClick={handleSyncGbp} disabled={syncing || !gbpInput.trim()} size="sm">
            {syncing ? 'Syncing...' : 'Sync from Google'}
          </Button>
        </div>
        {profile.gbp_last_synced && !syncError && (
          <p className="text-xs text-blue-600">
            Last synced: {new Date(profile.gbp_last_synced).toLocaleString()} · {profile.gbp_review_count} reviews · {profile.gbp_star_rating}★
          </p>
        )}
        {syncError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <p className="font-medium mb-1">⚠️ {syncError}</p>
            {needsPlaceId && (
              <p>
                <strong>Try pasting your Place ID instead</strong> (starts with <code className="bg-red-100 px-1 rounded">ChIJ</code>).{' '}
                Find yours at:{' '}
                <a
                  href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Place ID Finder →
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Core Info */}
      <div className="space-y-4">
        <h3 className="font-medium text-slate-800 border-b pb-2">Business Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label>Business Name</Label><Input value={profile.business_name} onChange={e => set('business_name', e.target.value)} /></div>
          <div className="col-span-2"><Label>Description</Label><textarea value={profile.description} onChange={e => set('description', e.target.value)} rows={3} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" /></div>
          <div><Label>Phone</Label><Input value={profile.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div><Label>Email</Label><Input value={profile.email} onChange={e => set('email', e.target.value)} /></div>
          <div><Label>Founder Name</Label><Input value={profile.founder_name} onChange={e => set('founder_name', e.target.value)} /></div>
          <div><Label>Founded Year</Label><Input type="number" value={profile.founding_year || ''} onChange={e => set('founding_year', parseInt(e.target.value) || null)} /></div>
          <div><Label>Price Range</Label><Input value={profile.price_range} placeholder="$$" onChange={e => set('price_range', e.target.value)} /></div>
          <div><Label>Team Size</Label><Input value={profile.num_employees} placeholder="10-50" onChange={e => set('num_employees', e.target.value)} /></div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="font-medium text-slate-800 border-b pb-2">Address</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label>Street Address</Label><Input value={profile.street_address} onChange={e => set('street_address', e.target.value)} /></div>
          <div><Label>City</Label><Input value={profile.city} onChange={e => set('city', e.target.value)} /></div>
          <div><Label>State</Label><Input value={profile.state} onChange={e => set('state', e.target.value)} /></div>
          <div><Label>ZIP Code</Label><Input value={profile.zip_code} onChange={e => set('zip_code', e.target.value)} /></div>
          <div><Label>Country</Label><Input value={profile.country} onChange={e => set('country', e.target.value)} /></div>
        </div>
      </div>

      {/* Service Area */}
      <div className="space-y-4">
        <h3 className="font-medium text-slate-800 border-b pb-2">Service Area</h3>
        <div><Label>Cities Served (comma-separated)</Label>
          <Input value={profile.service_cities.join(', ')} onChange={e => set('service_cities', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="Kansas City, Lee's Summit, Blue Springs" />
        </div>
        <div><Label>Service Radius (miles)</Label>
          <Input type="number" value={profile.service_radius_miles || ''} onChange={e => set('service_radius_miles', parseInt(e.target.value) || null)} />
        </div>
      </div>

      {/* Social Profiles */}
      <div className="space-y-4">
        <h3 className="font-medium text-slate-800 border-b pb-2">Social Profiles <span className="text-xs font-normal text-slate-500">(used in Organization schema sameAs)</span></h3>
        <div className="grid grid-cols-2 gap-4">
          {(['facebook','instagram','linkedin','twitter','youtube','tiktok'] as const).map(platform => (
            <div key={platform}>
              <Label className="capitalize">{platform}</Label>
              <Input value={profile.social_profiles[platform]} onChange={e => setSocial(platform, e.target.value)} placeholder={`https://${platform}.com/...`} />
            </div>
          ))}
        </div>
      </div>

      {/* GBP Reviews preview */}
      {profile.gbp_reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-800 border-b pb-2">Google Reviews ({profile.gbp_review_count} total)</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {profile.gbp_reviews.slice(0, 5).map((r, i) => (
              <div key={i} className="bg-slate-50 rounded p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-700">{r.author}</span>
                  <span className="text-yellow-500">{'★'.repeat(r.rating)}</span>
                  <span className="text-slate-400 text-xs">{r.date}</span>
                </div>
                <p className="text-slate-600 line-clamp-2">{r.text}</p>
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
        {saved && <span className="text-green-600 text-sm">✅ Saved</span>}
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </div>
  );
}
