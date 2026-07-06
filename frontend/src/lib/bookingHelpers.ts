// No access-code field exists in the schema yet — derive a stable 4-digit
// display code from the real booking id rather than fabricating a random one.
// Shared by UserDashboard.tsx and MyBookings.tsx so both "View Pass"/access
// code displays stay consistent for the same booking.
export function accessCode(id: string) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 10000
  return String(hash).padStart(4, '0')
}
