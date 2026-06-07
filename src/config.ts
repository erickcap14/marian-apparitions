export const config = {
  satelliteProvider: 'esri' as 'esri' | 'mapbox' | 'google',
  esriTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
} as const

// True only in the public static SPA (built with VITE_PUBLIC_BUILD=true). Vite inlines
// this at build time, so dead auth/AI branches are tree-shaken out of the public bundle —
// no /api calls, no auth UI, no AI buttons ship. The private LAN build leaves it false.
export const isPublicBuild = import.meta.env.VITE_PUBLIC_BUILD === 'true'
