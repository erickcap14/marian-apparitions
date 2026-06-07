import { useEffect, useRef, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { apparitions } from '../data/apparitions'
import type { Apparition } from '../data/types'
import { getCentury } from '../data/types'
import { MAP_INITIAL_CENTER, MAP_INITIAL_ZOOM, PIN_COLORS } from '../constants'
import { config } from '../config'

interface MapViewProps {
  onSelect: (a: Apparition) => void
  flyToId: string | null
  century: number | null
  country: string | null
  maxYear: number
  isSatellite: boolean
  statusFilter: string | null
}

const GRAPHIC_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: [config.esriTileUrl],
      tileSize: 256,
      attribution: '© Esri, Maxar, GeoEye',
    },
  },
  layers: [{ id: 'esri-satellite', type: 'raster', source: 'esri' }],
}

const POPUP_STYLE = `
  .maplibregl-popup-content {
    background: rgba(10,10,30,0.95);
    color: #f5f5f0;
    border: 1px solid rgba(245,200,66,0.3);
    border-radius: 4px;
    font-family: Inter, sans-serif;
    font-size: 12px;
    padding: 8px 12px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.6);
  }
  .maplibregl-popup-tip { display: none; }
  .maplibregl-popup-close-button { color: rgba(245,200,66,0.6); }
  .maplibregl-popup-close-button:hover { color: #f5c842; background: transparent; }
`

const SOURCE_ID = 'apparitions-source'
const GLOW_LAYER_ID = 'apparition-glow'
const PINS_LAYER_ID = 'apparition-pins'

// Data-driven color match expression for pins
const COLOR_MATCH_EXPR: maplibregl.ExpressionSpecification = [
  'match', ['get', 'status'],
  'approved',              PIN_COLORS.approved,
  'approved_for_devotion', PIN_COLORS.approved_for_devotion,
  'under_investigation',   PIN_COLORS.under_investigation,
  'not_approved',          PIN_COLORS.not_approved,
  'unapproved',            PIN_COLORS.unapproved,
  PIN_COLORS.approved, // fallback
]

function buildGeojson(
  list: Apparition[],
): GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; status: string }> {
  return {
    type: 'FeatureCollection',
    features: list.map((a) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
      properties: { id: a.id, status: a.status },
    })),
  }
}

function addLayers(map: maplibregl.Map, list: Apparition[]) {
  if (map.getSource(SOURCE_ID)) {
    if (map.getLayer(GLOW_LAYER_ID)) map.removeLayer(GLOW_LAYER_ID)
    if (map.getLayer(PINS_LAYER_ID)) map.removeLayer(PINS_LAYER_ID)
    map.removeSource(SOURCE_ID)
  }

  map.addSource(SOURCE_ID, { type: 'geojson', data: buildGeojson(list) })

  map.addLayer({
    id: GLOW_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-radius': 18,
      'circle-color': COLOR_MATCH_EXPR,
      'circle-opacity': 0.3,
      'circle-blur': 1,
    },
  })

  map.addLayer({
    id: PINS_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-radius': 7,
      'circle-color': COLOR_MATCH_EXPR,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
      'circle-stroke-opacity': 0.8,
      'circle-opacity': 1,
    },
  })
}

export function MapView({ onSelect, flyToId, century, country, maxYear, isSatellite, statusFilter }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const hoveredIdRef = useRef<string | null>(null)

  const filtered = useMemo(
    () =>
      apparitions.filter((a) => {
        if (a.year > maxYear) return false
        if (century !== null && getCentury(a.year) !== century) return false
        if (country !== null && a.country !== country) return false
        if (statusFilter !== null && a.status !== statusFilter) return false
        return true
      }),
    [maxYear, century, country, statusFilter],
  )

  // Keep a ref so the style.load closure always sees the latest filtered list
  const filteredRef = useRef(filtered)
  filteredRef.current = filtered

  // ── Map initialisation (runs once) ────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    if (!document.getElementById('mapview-popup-styles')) {
      const style = document.createElement('style')
      style.id = 'mapview-popup-styles'
      style.textContent = POPUP_STYLE
      document.head.appendChild(style)
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: GRAPHIC_STYLE,
      center: MAP_INITIAL_CENTER,
      zoom: MAP_INITIAL_ZOOM,
      attributionControl: false,
    })
    mapRef.current = map

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
    popupRef.current = popup

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    // Add layers on every genuine style load (initial + satellite toggle).
    // The isSatellite effect is now guarded to never call setStyle on mount,
    // so every style.load here is a legitimate event.
    map.on('style.load', () => {
      addLayers(map, filteredRef.current)
    })

    // Hover: popup + radius highlight (color preserved via data-driven expression)
    map.on('mouseenter', PINS_LAYER_ID, (e) => {
      map.getCanvas().style.cursor = 'pointer'
      const feature = e.features?.[0]
      if (!feature) return

      const id = feature.properties.id as string
      hoveredIdRef.current = id
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const apparition = apparitions.find((a) => a.id === id)
      if (!apparition) return

      // Increase radius for hovered pin; preserve status-based colors
      map.setPaintProperty(PINS_LAYER_ID, 'circle-radius', [
        'case', ['==', ['get', 'id'], id], 10, 7,
      ])

      popup.setLngLat(coords).setHTML(`<strong>${apparition.name}</strong><br>${apparition.year}`).addTo(map)
    })

    map.on('mouseleave', PINS_LAYER_ID, () => {
      map.getCanvas().style.cursor = ''
      hoveredIdRef.current = null
      map.setPaintProperty(PINS_LAYER_ID, 'circle-radius', 7)
      popup.remove()
    })

    map.on('click', PINS_LAYER_ID, (e) => {
      const feature = e.features?.[0]
      if (!feature) return
      const id = feature.properties.id as string
      const apparition = apparitions.find((a) => a.id === id)
      if (apparition) onSelect(apparition)
    })

    return () => {
      popup.remove()
      map.remove()
      mapRef.current = null
      popupRef.current = null
    }
  }, [onSelect])

  // ── Satellite / graphic style switch ──────────────────────────────────────
  // prevIsSatellite persists across StrictMode remounts, so we only call setStyle
  // when the value genuinely changes (not on mount or StrictMode re-invocation).
  const prevIsSatelliteRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (prevIsSatelliteRef.current === null) {
      prevIsSatelliteRef.current = isSatellite
      return
    }
    if (prevIsSatelliteRef.current === isSatellite) return
    prevIsSatelliteRef.current = isSatellite
    if (!mapRef.current) return
    mapRef.current.setStyle(isSatellite ? SATELLITE_STYLE : GRAPHIC_STYLE, { diff: false })
  }, [isSatellite])

  // ── Filter: update GeoJSON source data ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    src?.setData(buildGeojson(filtered))
  }, [filtered])

  // ── Fly to selected apparition (from sidebar) ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !flyToId) return
    const a = apparitions.find((x) => x.id === flyToId)
    if (a) mapRef.current.flyTo({ center: [a.lng, a.lat], zoom: 7, duration: 1500 })
  }, [flyToId])

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
