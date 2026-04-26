// Wrapper simples: guarda token em localStorage e injeta Bearer em todo fetch.

const KEY = 'live-auth-token'

export function getToken() { return localStorage.getItem(KEY) }
export function setToken(t) { localStorage.setItem(KEY, t) }
export function clearToken() { localStorage.removeItem(KEY) }

// Monkey-patch fetch pra incluir Authorization automaticamente
const original = window.fetch.bind(window)
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url
  if (url.startsWith('/api/') && !url.startsWith('/api/v1/auth/login') && !url.startsWith('/api/v1/auth/setup')) {
    const t = getToken()
    if (t) {
      const h = init.headers || {}
      const hasAuth = Object.keys(h).some(k => k.toLowerCase() === 'authorization')
      if (!hasAuth) init.headers = { ...h, Authorization: 'Bearer ' + t }
    }
  }
  const res = await original(input, init)
  if (res.status === 401 && url.startsWith('/api/') && !url.includes('/auth/')) {
    clearToken()
    // force reload
    if (window.location.pathname !== '/login') window.location.href = '/login'
  }
  return res
}
