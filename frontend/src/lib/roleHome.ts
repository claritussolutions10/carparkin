export function roleHome(role: string) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'owner') return '/owner/dashboard'
  return '/user/dashboard'
}
