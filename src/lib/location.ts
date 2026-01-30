// Check if query needs location info
export function needsLocation(query: string): boolean {
  const patterns = [
    /\b(weather|forecast|temperature)\b/i,
    /\b(near me|nearby|around here|close to me)\b/i,
    /\b(local|in my area|my location|where i am)\b/i,
    /\b(restaurants?|shops?|stores?|places?)\s*(near|around|close)/i,
    /\b(directions?|how to get|route to)\b/i,
  ]
  return patterns.some(p => p.test(query))
}

// Get user's geolocation
export function getGeolocation(): Promise<{ lat: number; lon: number; city?: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords
        
        // Try to reverse geocode to get city name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'User-Agent': 'OllamaChatPro/1.0' } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county
          resolve({ lat, lon, city })
        } catch {
          resolve({ lat, lon })
        }
      },
      () => resolve(null),
      { timeout: 10000, enableHighAccuracy: false }
    )
  })
}
