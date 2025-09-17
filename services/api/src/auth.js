import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export async function hashPassword(password) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

export async function authenticateUser(email, password) {
  try {
    const users = await query(
      "SELECT id, email, password_hash, role, name FROM users WHERE email = $1",
      [email]
    )
    
    if (users.length === 0) {
      throw new Error('Invalid credentials')
    }
    
    const user = users[0]
    const isValidPassword = await comparePassword(password, user.password_hash)
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }
    
    // Remove password_hash from returned user object
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    throw new Error('Authentication failed')
  }
}
