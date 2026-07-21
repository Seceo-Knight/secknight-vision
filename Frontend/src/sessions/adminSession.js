import { create } from 'zustand'
import { setSessionCookie, clearSessionCookie } from '../lib/sessionCookie'

const useAdminSession = create((set) => ({
  admin: null,
  setAdmin: (admin) => {
    if (admin) setSessionCookie(admin)
    set({ admin })
  },
  clearAdmin: () => {
    clearSessionCookie()
    set({ admin: null })
  },
}))

export default useAdminSession