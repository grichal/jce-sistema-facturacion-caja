import { NextResponse } from 'next/server'
import { listCierres } from '../../../../lib/firebase/cierre'

export async function GET() {
  try {
    const data = await listCierres(200)
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Error fetching cierres:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
