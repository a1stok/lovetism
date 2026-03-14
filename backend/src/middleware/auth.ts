import type { NextFunction, Request, Response } from 'express'
import { createUserSupabaseClient } from '../lib/supabase.js'

declare global {
  namespace Express {
    interface Request {
      accessToken?: string
      userId?: string
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing bearer token' })
  }

  const accessToken = authHeader.replace('Bearer ', '').trim()

  if (!accessToken) {
    return res.status(401).json({ message: 'Invalid bearer token' })
  }

  const supabase = createUserSupabaseClient(accessToken)
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  req.accessToken = accessToken
  req.userId = data.user.id
  next()
}
