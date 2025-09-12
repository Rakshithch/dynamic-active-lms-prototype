import pkg from 'pg'
const { Pool } = pkg

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'lms',
  password: process.env.DB_PASSWORD || 'lmspassword',
  database: process.env.DB_NAME || 'lmsdb'
})

export async function query(q, params = []) {
  const client = await pool.connect()
  try {
    const res = await client.query(q, params)
    return res.rows
  } finally {
    client.release()
  }
}
