import { useStore } from './store'

export async function fetchFromBackend(action: string, params: Record<string, string> = {}) {
  const url = useStore.getState().settings.appsScriptUrl
  if (!url) return null

  try {
    const query = new URLSearchParams({ action, ...params })
    const res = await fetch(`${url}?${query}`)
    const data = await res.json()
    if (data.error) {
      console.error('Backend error:', data.error)
      return null
    }
    return data
  } catch (e) {
    console.error('Backend fetch failed:', e)
    return null
  }
}

export async function postToBackend(action: string, payload: Record<string, unknown> = {}) {
  const url = useStore.getState().settings.appsScriptUrl
  if (!url) return null

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    })
    return await res.json()
  } catch (e) {
    console.error('Backend post failed:', e)
    return null
  }
}

export async function syncWithBackend() {
  const store = useStore.getState()
  if (!store.settings.appsScriptUrl) return false

  const [jobs, warranty] = await Promise.all([
    fetchFromBackend('jobs'),
    fetchFromBackend('warranty'),
  ])

  if (jobs) {
    const mapped = jobs.map((j: Record<string, unknown>) => ({
      date: j.routeDate || '',
      id: String(j.jobId || ''),
      customer: j.customer || '',
      city: j.city || '',
      state: j.state || '',
      zip: j.zip || '',
      priority: j.priority || 'Medium',
      tech: j.tech || '',
      type: 'Service',
      onsite: 2,
      travel: 1,
      miles: 0,
      parts: 0,
      consumables: 0,
      revenue: j.revenue || 0,
      wcase: '',
      wstatus: '',
      notes: j.notes || '',
      flags: [],
      status: 'scheduled',
      route: '',
      routeDate: j.routeDate || '',
      requested: j.requestedDate || '',
    }))
    store.setJobs(mapped)
  }

  if (warranty) {
    store.setWarranty(warranty)
  }

  return true
}

export async function fetchWeather(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit`
    )
    return await res.json()
  } catch {
    return null
  }
}
