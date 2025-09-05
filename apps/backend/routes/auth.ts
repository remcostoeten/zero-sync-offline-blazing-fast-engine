import { Hono } from 'hono'
import { auth } from '../lib/auth'
import type { AuthType } from '../lib/auth'

const router = new Hono<{ Bindings: AuthType }>({
  strict: false,
})

// Test endpoint
router.get('/test', (c) => {
  return c.json({ success: true, message: 'Auth routes are working' })
})

router.on(['POST', 'GET'], '/*', (c) => {
  console.log('Auth route hit:', c.req.url)
  return auth.handler(c.req.raw)
})

export default router
