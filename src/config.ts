export const config = {
  satelliteProvider: 'esri' as 'esri' | 'mapbox' | 'google',
  esriTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
} as const
