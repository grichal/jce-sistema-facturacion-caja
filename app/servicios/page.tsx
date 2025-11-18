'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { useToast } from '../hooks/useToast'
import MainLayout from '../components/MainLayout'

interface Servicio {
  id?: string
  Costo: number
  Descripcion: string
  Estatus: string
  TipoServicio: string
  TipoServicioRef?: string
}

interface TipoServicio {
  id: string
  Nombre: string
  Descripcion?: string
  Estatus: string
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tiposServicios, setTiposServicios] = useState<TipoServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTipos, setLoadingTipos] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Servicio>({
    Costo: 0,
    Descripcion: '',
    Estatus: 'Activo',
    TipoServicio: '',
    TipoServicioRef: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showTipoForm, setShowTipoForm] = useState(false)
  const [tipoFormData, setTipoFormData] = useState<TipoServicio>({
    id: '',
    Nombre: '',
    Descripcion: '',
    Estatus: 'Activo',
  })
  const [editingTipoId, setEditingTipoId] = useState<string | null>(null)
  const [tipoFormErrors, setTipoFormErrors] = useState<Record<string, string>>({})
  const { showSuccess, showError } = useToast()

  // Cargar servicios y tipos de servicios desde Firebase
  useEffect(() => {
    cargarServicios()
    cargarTiposServicios()
  }, [])

  const cargarServicios = async () => {
    if (!db) {
      console.error('Firebase no está inicializado. Verifica tu configuración.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const serviciosRef = collection(db, 'Servicios')
      const querySnapshot = await getDocs(serviciosRef)
      const serviciosData: Servicio[] = []
      
      querySnapshot.forEach((doc) => {
        serviciosData.push({
          id: doc.id,
          ...doc.data(),
        } as Servicio)
      })
      
      setServicios(serviciosData)
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      showError('Error al cargar los servicios. Verifica tu conexión a Firebase.')
    } finally {
      setLoading(false)
    }
  }

  const cargarTiposServicios = async () => {
    if (!db) {
      console.error('Firebase no está inicializado. Verifica tu configuración.')
      setLoadingTipos(false)
      return
    }

    try {
      setLoadingTipos(true)
      const tiposRef = collection(db, 'tiposDeServicio')
      const querySnapshot = await getDocs(tiposRef)
      const tiposData: TipoServicio[] = []
      
      querySnapshot.forEach((doc) => {
        tiposData.push({
          id: doc.id,
          ...doc.data(),
        } as TipoServicio)
      })
      
      // Filtrar solo los tipos activos
      const tiposActivos = tiposData.filter(tipo => tipo.Estatus === 'Activo')
      setTiposServicios(tiposActivos)
    } catch (error) {
      console.error('Error al cargar tipos de servicios:', error)
      showError('Error al cargar los tipos de servicios. Verifica tu conexión a Firebase.')
    } finally {
      setLoadingTipos(false)
    }
  }

  // Validar formulario antes de enviar
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}
    
    // Validar TipoServicio
    if (!formData.TipoServicio || formData.TipoServicio.trim() === '') {
      errors.TipoServicio = 'El tipo de servicio es obligatorio'
    }
    
    // Validar Descripcion
    if (!formData.Descripcion || formData.Descripcion.trim() === '') {
      errors.Descripcion = 'La descripción es obligatoria'
    }
    
    // Validar Costo - debe ser mayor a 0
    if (formData.Costo === undefined || formData.Costo === null || formData.Costo === 0) {
      errors.Costo = 'El costo es obligatorio y debe ser mayor a 0'
    } else if (isNaN(formData.Costo)) {
      errors.Costo = 'El costo debe ser un número válido'
    } else if (formData.Costo <= 0) {
      errors.Costo = 'El costo debe ser mayor a 0'
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

  // Validación para tipo de servicio
  const validateTipoForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}
    if (!tipoFormData.Nombre || tipoFormData.Nombre.trim() === '') {
      errors.Nombre = 'El nombre es obligatorio'
    }
    return { isValid: Object.keys(errors).length === 0, errors }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulario antes de enviar
    const validation = validateForm()
    setFormErrors(validation.errors)
    
    if (!validation.isValid) {
      // Mostrar todos los errores
      const errorMessages = Object.values(validation.errors)
      if (errorMessages.length > 0) {
        // Mostrar el primer error como toast
        showError(errorMessages[0])
        // Si hay más errores, mostrar un mensaje general
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
        // Actualizar servicio existente
        const servicioRef = doc(db, 'Servicios', editingId)
        await updateDoc(servicioRef, datosParaGuardar)
        showSuccess('Servicio actualizado correctamente')
      } else {
        // Crear nuevo servicio
        await addDoc(collection(db, 'Servicios'), datosParaGuardar)
        showSuccess('Servicio creado correctamente')
      }
      
      // Limpiar formulario y recargar
      setFormData({
        Costo: 0,
        Descripcion: '',
        Estatus: 'Activo',
        TipoServicio: '',
        TipoServicioRef: '',
      })
      setFormErrors({})
      setShowForm(false)
      setEditingId(null)
      cargarServicios()
      cargarTiposServicios() // Recargar tipos de servicios por si se agregó uno nuevo
    } catch (error: any) {
      console.error('Error al guardar servicio:', error)
      
      // Manejar errores específicos del backend
      let errorMessage = 'Error al guardar el servicio. Verifica tu conexión a Firebase.'
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'No tienes permisos para realizar esta acción.'
      } else if (error?.code === 'unavailable') {
        errorMessage = 'El servicio no está disponible. Por favor, intenta más tarde.'
      } else if (error?.message) {
        // Intentar extraer mensaje de error del backend
        const errorMsg = error.message.toLowerCase()
        
        if (errorMsg.includes('costo') || errorMsg.includes('cost')) {
          errorMessage = 'El costo es obligatorio y debe ser numérico.'
        } else if (errorMsg.includes('descripcion') || errorMsg.includes('description')) {
          errorMessage = 'La descripción es obligatoria.'
        } else if (errorMsg.includes('tipo') || errorMsg.includes('type')) {
          errorMessage = 'El tipo de servicio es obligatorio.'
        } else {
          errorMessage = error.message
        }
      }
      
      showError(errorMessage)
    }
  }

  const handleEdit = (servicio: Servicio) => {
    setFormData(servicio)
    setEditingId(servicio.id || null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      return
    }

    if (!db) {
      showError('Firebase no está inicializado. Verifica tu configuración en .env.local')
      return
    }

    try {
      await deleteDoc(doc(db, 'Servicios', id))
      showSuccess('Servicio eliminado correctamente')
      cargarServicios()
      cargarTiposServicios() // Recargar tipos de servicios
    } catch (error: any) {
      console.error('Error al eliminar servicio:', error)
      let errorMessage = 'Error al eliminar el servicio. Verifica tu conexión a Firebase.'
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'No tienes permisos para eliminar este servicio.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      showError(errorMessage)
    }
  }

  // Manejo de tipos de servicios
  const handleTipoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateTipoForm()
    setTipoFormErrors(validation.errors)
    if (!validation.isValid) {
      const msgs = Object.values(validation.errors)
      if (msgs.length) showError(msgs[0])
      return
    }
    if (!db) {
      showError('Firebase no está inicializado.')
      return
    }
    try {
      const { id, ...datos } = tipoFormData as any
      if (editingTipoId) {
        await updateDoc(doc(db, 'tiposDeServicio', editingTipoId), datos)
        showSuccess('Tipo de servicio actualizado')
      } else {
        await addDoc(collection(db, 'tiposDeServicio'), datos)
        showSuccess('Tipo de servicio creado')
      }
      // limpiar y recargar
      setTipoFormData({ id: '', Nombre: '', Descripcion: '', Estatus: 'Activo' })
      setEditingTipoId(null)
      setTipoFormErrors({})
      setShowTipoForm(false)
      cargarTiposServicios()
    } catch (error: any) {
      console.error('Error tipos:', error)
      showError(error?.message || 'Error al guardar tipo de servicio')
    }
  }

  const handleTipoEdit = (tipo: TipoServicio) => {
    setTipoFormData({ ...tipo })
    setEditingTipoId(tipo.id)
    setShowTipoForm(true)
  }

  const handleTipoDelete = async (id: string) => {
    if (!confirm('¿Eliminar tipo de servicio?')) return
    if (!db) {
      showError('Firebase no está inicializado.')
      return
    }
    try {
      await deleteDoc(doc(db, 'tiposDeServicio', id))
      showSuccess('Tipo eliminado')
      cargarTiposServicios()
    } catch (error: any) {
      console.error('Error al eliminar tipo:', error)
      showError(error?.message || 'Error al eliminar tipo')
    }
  }

  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(monto)
  }

  // Función para determinar la categoría de un servicio
  const getServiceCategory = (servicio: Servicio): string => {
    const tipoServicio = servicio.TipoServicio?.toLowerCase() || ''
    const descripcion = servicio.Descripcion?.toLowerCase() || ''
    const tipoRef = servicio.TipoServicioRef?.toLowerCase() || ''
    
    const searchText = `${tipoServicio} ${descripcion} ${tipoRef}`
    
    if (searchText.includes('cédula') || searchText.includes('identidad') || searchText.includes('carnet')) {
      return 'identidad'
    }
    if (searchText.includes('acta') || searchText.includes('nacimiento') || searchText.includes('matrimonio') || searchText.includes('defunción') || searchText.includes('civil')) {
      return 'civil'
    }
    if (searchText.includes('electoral') || searchText.includes('votación') || searchText.includes('padrón') || searchText.includes('partido')) {
      return 'electoral'
    }
    return 'otros'
  }

  // Filtrar servicios
  const filteredServicios = servicios.filter((servicio) => {
    const matchesSearch = 
      servicio.TipoServicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servicio.Descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servicio.TipoServicioRef?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = 
      activeCategory === 'all' || 
      getServiceCategory(servicio) === activeCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Servicios</h1>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
              setFormData({
                Costo: 0,
                Descripcion: '',
                Estatus: 'Activo',
                TipoServicio: '',
                TipoServicioRef: '',
              })
              setFormErrors({})
            }}
            className={styles.btnPrimary}
          >
            {showForm ? 'Cancelar' : '+ Nuevo Servicio'}
          </button>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
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
                  <label htmlFor="tipoServicio">Tipo de Servicio *</label>
                  {loadingTipos ? (
                    <div className={styles.loadingTipos}>Cargando tipos de servicios...</div>
                  ) : (
                    <select
                      id="tipoServicio"
                      value={formData.TipoServicio}
                      onChange={(e) => {
                        setFormData({ ...formData, TipoServicio: e.target.value })
                        if (formErrors.TipoServicio) {
                          setFormErrors({ ...formErrors, TipoServicio: '' })
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.target.value || e.target.value.trim() === '') {
                          setFormErrors({ ...formErrors, TipoServicio: 'El tipo de servicio es obligatorio' })
                        }
                      }}
                      required
                      className={`${styles.input} ${formErrors.TipoServicio ? styles.inputError : ''}`}
                    >
                      <option value="">Seleccione un tipo de servicio</option>
                      {tiposServicios.map((tipo) => (
                        <option key={tipo.id} value={tipo.Nombre}>
                          {tipo.Nombre}
                        </option>
                      ))}
                    </select>
                  )}
                  {tiposServicios.length === 0 && !loadingTipos && (
                    <p className={styles.warningMessage}>
                      No hay tipos de servicios disponibles. Por favor, crea uno en{' '}
                      <a href="/tipos-de-servicios" className={styles.link}>
                        Tipos de Servicios
                      </a>
                    </p>
                  )}
                  {formErrors.TipoServicio && (
                    <span className={styles.errorMessage}>{formErrors.TipoServicio}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="descripcion">Descripción *</label>
                  <textarea
                    id="descripcion"
                    value={formData.Descripcion}
                    onChange={(e) => {
                      setFormData({ ...formData, Descripcion: e.target.value })
                      if (formErrors.Descripcion) {
                        setFormErrors({ ...formErrors, Descripcion: '' })
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || e.target.value.trim() === '') {
                        setFormErrors({ ...formErrors, Descripcion: 'La descripción es obligatoria' })
                      }
                    }}
                    rows={4}
                    className={`${styles.textarea} ${formErrors.Descripcion ? styles.inputError : ''}`}
                    required
                    placeholder="Descripción detallada del servicio"
                  />
                  {formErrors.Descripcion && (
                    <span className={styles.errorMessage}>{formErrors.Descripcion}</span>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="costo">Costo (RD$) *</label>
                    <input
                      type="number"
                      id="costo"
                      value={formData.Costo || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        const value = inputValue === '' ? 0 : parseFloat(inputValue)
                        setFormData({
                          ...formData,
                          Costo: isNaN(value) ? 0 : value,
                        })
                        if (formErrors.Costo) {
                          setFormErrors({ ...formErrors, Costo: '' })
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        if (value <= 0) {
                          setFormErrors({ ...formErrors, Costo: 'El costo debe ser mayor a 0' })
                        }
                      }}
                      required
                      min="0.01"
                      step="0.01"
                      className={`${styles.input} ${formErrors.Costo ? styles.inputError : ''}`}
                      placeholder="0.00"
                    />
                    {formErrors.Costo && (
                      <span className={styles.errorMessage}>{formErrors.Costo}</span>
                    )}
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
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tipoServicioRef">Tipo Servicio Ref (Opcional)</label>
                  <input
                    type="text"
                    id="tipoServicioRef"
                    value={formData.TipoServicioRef || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, TipoServicioRef: e.target.value })
                    }
                    className={styles.input}
                    placeholder="Referencia del tipo de servicio"
                  />
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
                    {editingId ? 'Actualizar' : 'Crear'} Servicio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Formulario para Tipos de Servicio */}
        {showTipoForm && (
          <div className={styles.modalOverlay} onClick={() => setShowTipoForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingTipoId ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}
                </h2>
                <button
                  onClick={() => setShowTipoForm(false)}
                  className={styles.closeButton}
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleTipoSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    value={tipoFormData.Nombre}
                    onChange={(e) => {
                      setTipoFormData({ ...tipoFormData, Nombre: e.target.value })
                      if (tipoFormErrors.Nombre) {
                        setTipoFormErrors({ ...tipoFormErrors, Nombre: '' })
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || e.target.value.trim() === '') {
                        setTipoFormErrors({ ...tipoFormErrors, Nombre: 'El nombre es obligatorio' })
                      }
                    }}
                    required
                    className={`${styles.input} ${tipoFormErrors.Nombre ? styles.inputError : ''}`}
                    placeholder="Nombre del tipo de servicio"
                  />
                  {tipoFormErrors.Nombre && (
                    <span className={styles.errorMessage}>{tipoFormErrors.Nombre}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="descripcion">Descripción (Opcional)</label>
                  <textarea
                    id="descripcion"
                    value={tipoFormData.Descripcion}
                    onChange={(e) => setTipoFormData({ ...tipoFormData, Descripcion: e.target.value })}
                    rows={4}
                    className={styles.textarea}
                    placeholder="Descripción del tipo de servicio"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="estatusTipo">Estatus *</label>
                  <select
                    id="estatusTipo"
                    value={tipoFormData.Estatus}
                    onChange={(e) => setTipoFormData({ ...tipoFormData, Estatus: e.target.value })}
                    required
                    className={`${styles.input} ${tipoFormErrors.Estatus ? styles.inputError : ''}`}
                  >
                    <option value="">Seleccione un estatus</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                  {tipoFormErrors.Estatus && (
                    <span className={styles.errorMessage}>{tipoFormErrors.Estatus}</span>
                  )}
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowTipoForm(false)}
                    className={styles.btnCancel}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSubmit}>
                    {editingTipoId ? 'Actualizar' : 'Crear'} Tipo de Servicio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!loading && servicios.length > 0 && (
          <div className={styles.filtersContainer}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                id="searchInput"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                placeholder="Buscar servicio por nombre (ej: Cédula, Acta, etc.)"
              />
            </div>
            
            <div className={styles.filtersButtons}>
              <button
                className={`${styles.filterBtn} ${activeCategory === 'all' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Todos
              </button>
              <button
                className={`${styles.filterBtn} ${activeCategory === 'identidad' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveCategory('identidad')}
              >
                Identidad
              </button>
              <button
                className={`${styles.filterBtn} ${activeCategory === 'civil' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveCategory('civil')}
              >
                Registro Civil
              </button>
              <button
                className={`${styles.filterBtn} ${activeCategory === 'electoral' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveCategory('electoral')}
              >
                Electoral
              </button>
              <button
                className={`${styles.filterBtn} ${activeCategory === 'otros' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveCategory('otros')}
              >
                Otros
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Cargando servicios...</div>
        ) : servicios.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay servicios registrados.</p>
            <p>Haz clic en "Nuevo Servicio" para agregar uno.</p>
          </div>
        ) : filteredServicios.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No se encontraron servicios que coincidan con su búsqueda.</p>
          </div>
        ) : (
          <div className={styles.serviciosGrid}>
            {filteredServicios.map((servicio) => (
              <div key={servicio.id} className={styles.servicioCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.servicioNombre}>{servicio.Descripcion || 'Sin descripción'}</h3>
                  <span
                    className={`${styles.badge} ${
                      servicio.Estatus === 'Activo' ? styles.badgeActive : styles.badgeInactive
                    }`}
                  >
                    {servicio.Estatus || 'Inactivo'}
                  </span>
                </div>
                {servicio.TipoServicio && (
                  <p className={styles.servicioTipo}>
                    <strong>Tipo:</strong> {servicio.TipoServicio}
                  </p>
                )}
                {servicio.TipoServicioRef && (
                  <p className={styles.servicioRef}>
                    <strong>Ref:</strong> {servicio.TipoServicioRef}
                  </p>
                )}
                <div className={styles.servicioPrecio}>
                  {formatearMoneda(servicio.Costo || 0)}
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleEdit(servicio)}
                    className={styles.btnEdit}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => servicio.id && handleDelete(servicio.id)}
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
