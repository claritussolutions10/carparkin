export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!))
    if (typeof payload.exp !== 'number') return false
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}
