import { NextResponse } from 'next/server'
import { getCierreById } from '../../../../../lib/firebase/cierre'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const data = await getCierreById(id)
    if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Error fetching cierre by id:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
