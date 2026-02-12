import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore } from '@/lib/store'
import { CONFIG, ROUTES_DATA } from '@/lib/config'
import { fmt } from '@/lib/utils'
import { calcJobCost } from '@/lib/costs'
import { fetchWeather } from '@/lib/api'

const ROUTE_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#84cc16', '#f97316']

function makeIcon(color: string, size = 28) {
  return L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })
}

const depotIcon = makeIcon('#1F4E79', 36)

export default function MapView() {
  const jobs = useStore(s => s.jobs)
  const [weather, setWeather] = useState<{ temp: number; wind: number } | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string>('')

  useEffect(() => {
    fetchWeather(CONFIG.DEPOT.lat, CONFIG.DEPOT.lng).then(data => {
      if (data?.current) {
        setWeather({ temp: Math.round(data.current.temperature_2m), wind: Math.round(data.current.wind_speed_10m) })
      }
    })
  }, [])

  const routeGroups = useMemo(() => {
    const groups: Record<string, typeof jobs> = {}
    jobs.forEach(j => {
      if (j.route) {
        if (!groups[j.route]) groups[j.route] = []
        groups[j.route].push(j)
      }
    })
    return groups
  }, [jobs])

  const displayRoutes = selectedRoute ? { [selectedRoute]: routeGroups[selectedRoute] || [] } : routeGroups

  // Generate pseudo-coordinates for jobs based on route
  const jobCoords = useMemo(() => {
    const coords: Record<string, [number, number]> = {}
    let seed = 42
    const pseudoRandom = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

    Object.entries(routeGroups).forEach(([routeId, routeJobs]) => {
      const route = ROUTES_DATA.find(r => r.id === routeId)
      const spread = route ? Math.min(route.miles / 200, 2) : 1
      routeJobs.forEach(j => {
        coords[j.id] = [
          CONFIG.DEPOT.lat + (pseudoRandom() - 0.5) * spread * 2,
          CONFIG.DEPOT.lng + (pseudoRandom() - 0.5) * spread * 2,
        ]
      })
    })
    return coords
  }, [routeGroups])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={selectedRoute}
          onChange={e => setSelectedRoute(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Routes</option>
          {Object.keys(routeGroups).sort().map(r => (
            <option key={r} value={r}>{r} ({routeGroups[r].length} jobs)</option>
          ))}
        </select>

        {weather && (
          <div className="ml-auto flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm">
            <span className="font-bold text-blue-700">{weather.temp}°F</span>
            <span className="text-blue-600">Wind: {weather.wind} mph</span>
            <span className="text-blue-500 text-xs">@ HQ</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        <MapContainer
          center={[CONFIG.DEPOT.lat, CONFIG.DEPOT.lng]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Depot */}
          <Marker position={[CONFIG.DEPOT.lat, CONFIG.DEPOT.lng]} icon={depotIcon}>
            <Popup><b>Akino Solar HQ</b><br />Knoxville, TN 37931</Popup>
          </Marker>

          {/* Route jobs & polylines */}
          {Object.entries(displayRoutes).map(([routeId, routeJobs], idx) => {
            const color = ROUTE_COLORS[idx % ROUTE_COLORS.length]
            const icon = makeIcon(color)
            const points: [number, number][] = [[CONFIG.DEPOT.lat, CONFIG.DEPOT.lng]]

            return routeJobs?.map(job => {
              const coord = jobCoords[job.id]
              if (!coord) return null
              points.push(coord)
              const cost = calcJobCost(job)

              return (
                <div key={job.id}>
                  <Marker position={coord} icon={icon}>
                    <Popup>
                      <div className="text-sm">
                        <b>{job.customer}</b><br />
                        {job.city}{job.city ? ', ' : ''}{job.state}<br />
                        Route: {routeId} &bull; Tech: {job.tech || 'TBD'}<br />
                        Revenue: {fmt(job.revenue)}<br />
                        Profit: <span style={{ color: cost.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(cost.profit)}</span>
                      </div>
                    </Popup>
                  </Marker>
                  <Polyline positions={points} color={color} weight={2} opacity={0.6} />
                </div>
              )
            })
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.keys(displayRoutes).map((routeId, idx) => (
          <div key={routeId} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROUTE_COLORS[idx % ROUTE_COLORS.length] }} />
            <span className="font-medium">{routeId}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
