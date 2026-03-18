export const AUTO_REFRESH_INTERVAL_MS = 60 * 1000

function normalizeForSnapshot(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeForSnapshot)
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeForSnapshot(value[key])
        return acc
      }, {})
  }

  return value
}

export function buildSnapshot(value) {
  return JSON.stringify(normalizeForSnapshot(value))
}
