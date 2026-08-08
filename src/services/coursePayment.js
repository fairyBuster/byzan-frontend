import api from './api'

/**
 * Beli course gratis — langsung enroll.
 * POST /api/courses/buy/
 */
export async function buyFreeCourse(courseId) {
  const { data } = await api.post('/courses/buy/', { course_id: Number(courseId) })
  return data
}

/**
 * Beli course berbayar pakai saldo internal.
 * POST /api/courses/buy/balance/
 */
export async function buyWithBalance(courseId) {
  const { data } = await api.post('/courses/buy/balance/', { course_id: Number(courseId) })
  return data
}

/**
 * Inisiasi pembayaran via Midtrans Snap.
 * POST /api/courses/buy/midtrans/
 * Response mengandung snap_token dan snap_redirect_url.
 */
export async function buyWithMidtrans(courseId) {
  const { data } = await api.post('/courses/buy/midtrans/', { course_id: Number(courseId) })
  return data
}

/**
 * Riwayat transaksi user.
 * GET /api/courses/transactions/
 */
export async function getTransactions() {
  const { data } = await api.get('/courses/transactions/')
  return data
}
