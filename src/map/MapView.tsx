import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { apparitions } from '../data/apparitions'
import type { Apparition } from '../data/types'
import { MAP_INITIAL_CENTER, MAP_INITIAL_ZOOM, PIN_COLOR_GOLD, PIN_COLOR_HOVER } from '../constants'

interface MapViewProps {
  onSelect: (a: Apparition) => void
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
  .maplibregl-popup-tip {
    display: none;
  }
  .maplibregl-popup-close-button {
    color: rgba(245,200,66,0.6);
  }
  .maplibregl-popup-close-button:hover {
    color: #f5c842;
    background: transparent;
  }
`

const SOURCE_ID = 'apparitions-source'
const GLOW_LAYER_ID = 'apparition-glow'
const PINS_LAYER_ID = 'apparition-pins'

export function MapView({ onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const hoveredIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Inject dark popup styles once
    if (!document.getElementById('mapview-popup-styles')) {
      const style = document.createElement('style')
      style.id = 'mapview-popup-styles'
      style.textContent = POPUP_STYLE
      document.head.appendChild(style)
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: MAP_INITIAL_CENTER,
      zoom: MAP_INITIAL_ZOOM,
      attributionControl: false,
    })

    mapRef.current = map

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    })
    popupRef.current = popup

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, { id: string }> = {
        type: 'FeatureCollection',
        features: apparitions.map((a) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [a.lng, a.lat],
          },
          properties: {
            id: a.id,
          },
        })),
      }

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      })

      // Glow layer — large blurred circle beneath each pin
      map.addLayer({
        id: GLOW_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 18,
          'circle-color': PIN_COLOR_GOLD,
          'circle-opacity': 0.3,
          'circle-blur': 1,
        },
      })

      // Pin layer — crisp circle on top
      map.addLayer({
        id: PINS_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 7,
          'circle-color': PIN_COLOR_GOLD,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-stroke-opacity': 0.8,
          'circle-opacity': 1,
        },
      })

      // Hover: show popup + highlight pin
      map.on('mouseenter', PINS_LAYER_ID, (e) => {
        map.getCanvas().style.cursor = 'pointer'

        const feature = e.features?.[0]
        if (!feature) return

        const id = feature.properties.id as string
        hoveredIdRef.current = id

        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
        const apparition = apparitions.find((a) => a.id === id)
        if (!apparition) return

        map.setPaintProperty(PINS_LAYER_ID, 'circle-color', [
          'case',
          ['==', ['get', 'id'], id],
          PIN_COLOR_HOVER,
          PIN_COLOR_GOLD,
        ])
        map.setPaintProperty(GLOW_LAYER_ID, 'circle-color', [
          'case',
          ['==', ['get', 'id'], id],
          PIN_COLOR_HOVER,
          PIN_COLOR_GOLD,
        ])

        popup
          .setLngLat(coords)
          .setHTML(`<strong>${apparition.name}</strong><br>${apparition.year}`)
          .addTo(map)
      })

      // Mouseleave: restore colors + hide popup
      map.on('mouseleave', PINS_LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
        hoveredIdRef.current = null

        map.setPaintProperty(PINS_LAYER_ID, 'circle-color', PIN_COLOR_GOLD)
        map.setPaintProperty(GLOW_LAYER_ID, 'circle-color', PIN_COLOR_GOLD)

        popup.remove()
      })

      // Click: call onSelect with the full Apparition object
      map.on('click', PINS_LAYER_ID, (e) => {
        const feature = e.features?.[0]
        if (!feature) return

        const id = feature.properties.id as string
        const apparition = apparitions.find((a) => a.id === id)
        if (apparition) {
          onSelect(apparition)
        }
      })
    })

    return () => {
      popup.remove()
      map.remove()
      mapRef.current = null
      popupRef.current = null
    }
  }, [onSelect])

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
