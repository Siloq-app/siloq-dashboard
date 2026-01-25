import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './api-client'
import type { Site, ContentJob, Page, ReverseSilo, SystemEvent, BillingUsage, Entity, RestorationJob, EntityCoverage } from './types'

// Sites
export const useSites = () => {
  return useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sites')
      return data
    },
  })
}

export const useSite = (id: string) => {
  return useQuery<Site>({
    queryKey: ['sites', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/sites/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export const useCreateSite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (siteData: { url: string; name?: string }) => {
      const { data } = await apiClient.post('/sites', siteData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}

// Pages
export const usePages = (siteId: string) => {
  return useQuery<Page[]>({
    queryKey: ['sites', siteId, 'pages'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/sites/${siteId}/pages`)
      return data
    },
    enabled: !!siteId,
  })
}

export const usePage = (pageId: string) => {
  return useQuery<Page>({
    queryKey: ['pages', pageId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/pages/${pageId}`)
      return data
    },
    enabled: !!pageId,
  })
}

// Reverse Silos
export const useReverseSilos = (siteId?: string) => {
  return useQuery<ReverseSilo[]>({
    queryKey: ['reverse-silos', siteId],
    queryFn: async () => {
      const url = siteId ? `/reverse-silos?siteId=${siteId}` : '/reverse-silos'
      const { data } = await apiClient.get(url)
      return data
    },
  })
}

export const useReverseSilo = (id: string) => {
  return useQuery<ReverseSilo>({
    queryKey: ['reverse-silos', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/reverse-silos/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export const useCreateReverseSilo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (siloData: Partial<ReverseSilo>) => {
      const { data } = await apiClient.post('/reverse-silos', siloData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reverse-silos'] })
    },
  })
}

export const useFinalizeSilo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (siloId: string) => {
      const { data } = await apiClient.post(`/reverse-silos/${siloId}/finalize`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reverse-silos'] })
    },
  })
}

// Content Jobs
export const useContentJobs = (filters?: { status?: string; siteId?: string }) => {
  return useQuery<ContentJob[]>({
    queryKey: ['content-jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.siteId) params.append('siteId', filters.siteId)
      const { data } = await apiClient.get(`/content-jobs?${params.toString()}`)
      return data
    },
  })
}

export const useContentJob = (id: string) => {
  return useQuery<ContentJob>({
    queryKey: ['content-jobs', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/content-jobs/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export const useCreateContentJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (jobData: { pageId: string; siteId: string }) => {
      const { data } = await apiClient.post('/content-jobs', jobData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-jobs'] })
    },
  })
}

// System Events
export const useSystemEvents = (filters?: { eventType?: string; siteId?: string }) => {
  return useQuery<SystemEvent[]>({
    queryKey: ['events', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.eventType) params.append('eventType', filters.eventType)
      if (filters?.siteId) params.append('siteId', filters.siteId)
      const { data } = await apiClient.get(`/events?${params.toString()}`)
      return data
    },
  })
}

// Billing
export const useBillingUsage = () => {
  return useQuery<BillingUsage>({
    queryKey: ['billing', 'usage'],
    queryFn: async () => {
      const { data } = await apiClient.get('/billing/usage')
      return data
    },
  })
}

// Entities
export const useEntities = (siteId?: string) => {
  return useQuery<Entity[]>({
    queryKey: ['entities', siteId],
    queryFn: async () => {
      const url = siteId ? `/entities?siteId=${siteId}` : '/entities'
      const { data } = await apiClient.get(url)
      return data
    },
  })
}

export const useEntityCoverage = (siteId?: string) => {
  return useQuery<EntityCoverage[]>({
    queryKey: ['entity-coverage', siteId],
    queryFn: async () => {
      const url = siteId ? `/entities/coverage?siteId=${siteId}` : '/entities/coverage'
      const { data } = await apiClient.get(url)
      return data
    },
  })
}

// Restoration Queue
export const useRestorationQueue = () => {
  return useQuery<RestorationJob[]>({
    queryKey: ['restoration-queue'],
    queryFn: async () => {
      const { data } = await apiClient.get('/restoration-queue')
      return data
    },
  })
}

export const useCreateRestorationJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (jobData: { siteId: string; priority?: 'low' | 'medium' | 'high' | 'critical' }) => {
      const { data } = await apiClient.post('/restoration-queue', jobData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restoration-queue'] })
    },
  })
}

export const useCancelRestorationJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await apiClient.delete(`/restoration-queue/${jobId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restoration-queue'] })
    },
  })
}
