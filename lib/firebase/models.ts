export interface CierreCaja {
  id?: string
  fecha: string // ISO string
  usuario?: string
  efectivoInicial?: number
  efectivoFinal?: number
  totalVentas?: number
  totalIngresos?: number
  totalEgresos?: number
  comentarios?: string
  createdAt?: any // Firestore Timestamp
}

export type NewCierre = Omit<CierreCaja, 'id' | 'createdAt'>
