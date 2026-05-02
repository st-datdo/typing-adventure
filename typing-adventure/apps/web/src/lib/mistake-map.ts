/**
 * Safely parse a Prisma Json field into a Record<string, number>.
 * Returns empty object if the value is not a valid mistake map.
 */
export function safeMistakeMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'number') {
      result[key] = value
    }
  }
  return result
}
