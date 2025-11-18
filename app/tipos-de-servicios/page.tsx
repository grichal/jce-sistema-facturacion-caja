'use client'

import { useEffect, useState } from 'react'
import MainLayout from '../components/MainLayout'
import styles from './page.module.css'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { useToast } from '../hooks/useToast'

interface TipoServicio {
  id?: string
  Nombre: string
  Descripcion?: string
  Estatus: string
}

export default function TiposDeServiciosPage() {
  const [tiposServicios, setTiposServicios] = useState<TipoServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<TipoServicio>({
    Nombre: '',
    Descripcion: '',
    Estatus: 'Activo',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { showSuccess, showError } = useToast()

  // Cargar tipos de servicios desde Firebase
  useEffect(() => {
    cargarTiposServicios()
  }, [])

  const cargarTiposServicios = async () => {
    if (!db) {
      console.error('Firebase no está inicializado. Verifica tu configuración.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const tiposRef = collection(db, 'tiposDeServicio')
      const querySnapshot = await getDocs(tiposRef)
      const tiposData: TipoServicio[] = []
      
      querySnapshot.forEach((doc) => {
        tiposData.push({
          id: doc.id,
          ...doc.data(),
        } as TipoServicio)
      })
      
      setTiposServicios(tiposData)
    } catch (error) {
      console.error('Error al cargar tipos de servicios:', error)
      showError('Error al cargar los tipos de servicios. Verifica tu conexión a Firebase.')
    } finally {
      setLoading(false)
    }
  }

  // Validar formulario antes de enviar
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}
    
    // Validar Nombre
    if (!formData.Nombre || formData.Nombre.trim() === '') {
      errors.Nombre = 'El nombre del tipo de servicio es obligatorio'
    }
    
    // Validar Estatus
    if (!formData.Estatus || formData.Estatus.trim() === '') {
      errors.Estatus = 'El estatus es obligatorio'
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulario antes de enviar
    const validation = validateForm()
    setFormErrors(validation.errors)
    
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors)
      if (errorMessages.length > 0) {
        showError(errorMessages[0])
        if (errorMessages.length > 1) {
          setTimeout(() => {
            showError(`Hay ${errorMessages.length} campos con errores. Por favor, revisa el formulario.`)
          }, 100)
        }
      }
      return
    }
    
    if (!db) {
      showError('Firebase no está inicializado. Verifica tu configuración en .env.local')
      return
    }
    
    try {
      // Preparar datos para guardar (sin el id)
      const { id, ...datosParaGuardar } = formData
      
      if (editingId) {
        // Actualizar tipo de servicio existente
        const tipoRef = doc(db, 'tiposDeServicio', editingId)
        await updateDoc(tipoRef, datosParaGuardar)
        showSuccess('Tipo de servicio actualizado correctamente')
      } else {
        // Crear nuevo tipo de servicio
        await addDoc(collection(db, 'tiposDeServicio'), datosParaGuardar)
        showSuccess('Tipo de servicio creado correctamente')
      }
      
      // Limpiar formulario y recargar
      setFormData({
        Nombre: '',
        Descripcion: '',
        Estatus: 'Activo',
      })
      setFormErrors({})
      setShowForm(false)
      setEditingId(null)
      cargarTiposServicios()
    } catch (error: any) {
      console.error('Error al guardar tipo de servicio:', error)
      
      let errorMessage = 'Error al guardar el tipo de servicio. Verifica tu conexión a Firebase.'
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'No tienes permisos para realizar esta acción.'
      } else if (error?.code === 'unavailable') {
        errorMessage = 'El servicio no está disponible. Por favor, intenta más tarde.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      showError(errorMessage)
    }
  }

  const handleEdit = (tipo: TipoServicio) => {
    setFormData(tipo)
    setEditingId(tipo.id || null)
    setShowForm(true)
    setFormErrors({})
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tipo de servicio?')) {
      return
    }

    if (!db) {
      showError('Firebase no está inicializado. Verifica tu configuración en .env.local')
      return
    }

    try {
      await deleteDoc(doc(db, 'tiposDeServicio', id))
      showSuccess('Tipo de servicio eliminado correctamente')
      cargarTiposServicios()
    } catch (error: any) {
      console.error('Error al eliminar tipo de servicio:', error)
      let errorMessage = 'Error al eliminar el tipo de servicio. Verifica tu conexión a Firebase.'
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'No tienes permisos para eliminar este tipo de servicio.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      showError(errorMessage)
    }
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tipos de Servicios</h1>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
              setFormData({
                Nombre: '',
                Descripcion: '',
                Estatus: 'Activo',
              })
              setFormErrors({})
            }}
            className={styles.btnPrimary}
          >
            {showForm ? 'Cancelar' : '+ Nuevo Tipo de Servicio'}
          </button>
        </div>

        {showForm && (
          <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingId ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className={styles.closeButton}
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="nombre">Nombre del Tipo de Servicio *</label>
                  <input
                    type="text"
                    id="nombre"
                    value={formData.Nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, Nombre: e.target.value })
                      if (formErrors.Nombre) {
                        setFormErrors({ ...formErrors, Nombre: '' })
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || e.target.value.trim() === '') {
                        setFormErrors({ ...formErrors, Nombre: 'El nombre del tipo de servicio es obligatorio' })
                      }
                    }}
                    required
                    className={`${styles.input} ${formErrors.Nombre ? styles.inputError : ''}`}
                    placeholder="Ej: Consultoría, Desarrollo, etc."
                  />
                  {formErrors.Nombre && (
                    <span className={styles.errorMessage}>{formErrors.Nombre}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="descripcion">Descripción (Opcional)</label>
                  <textarea
                    id="descripcion"
                    value={formData.Descripcion || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, Descripcion: e.target.value })
                    }}
                    rows={4}
                    className={styles.textarea}
                    placeholder="Descripción del tipo de servicio"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="estatus">Estatus *</label>
                  <select
                    id="estatus"
                    value={formData.Estatus}
                    onChange={(e) => {
                      setFormData({ ...formData, Estatus: e.target.value })
                      if (formErrors.Estatus) {
                        setFormErrors({ ...formErrors, Estatus: '' })
                      }
                    }}
                    required
                    className={`${styles.input} ${formErrors.Estatus ? styles.inputError : ''}`}
                  >
                    <option value="">Seleccione un estatus</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                  {formErrors.Estatus && (
                    <span className={styles.errorMessage}>{formErrors.Estatus}</span>
                  )}
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={styles.btnCancel}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSubmit}>
                    {editingId ? 'Actualizar' : 'Crear'} Tipo de Servicio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Cargando tipos de servicios...</div>
        ) : tiposServicios.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay tipos de servicios registrados.</p>
            <p>Haz clic en "Nuevo Tipo de Servicio" para agregar uno.</p>
          </div>
        ) : (
          <div className={styles.tiposGrid}>
            {tiposServicios.map((tipo) => (
              <div key={tipo.id} className={styles.tipoCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.tipoNombre}>{tipo.Nombre}</h3>
                  <span
                    className={`${styles.badge} ${
                      tipo.Estatus === 'Activo' ? styles.badgeActive : styles.badgeInactive
                    }`}
                  >
                    {tipo.Estatus || 'Inactivo'}
                  </span>
                </div>
                {tipo.Descripcion && (
                  <p className={styles.tipoDescripcion}>
                    {tipo.Descripcion}
                  </p>
                )}
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleEdit(tipo)}
                    className={styles.btnEdit}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => tipo.id && handleDelete(tipo.id)}
                    className={styles.btnDelete}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

