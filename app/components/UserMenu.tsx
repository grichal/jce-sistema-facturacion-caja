'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function UserMenu() {
  const auth = useAuth()
  const [open, setOpen] = useState(false)

  if (auth.loading) return null

  return (
    <div style={{position:'relative'}}>
      <button onClick={() => setOpen((s) => !s)} style={{background:'transparent', border:'none', cursor:'pointer'}}>
        👤 {auth.user ? auth.user.username : 'Invitado'}
      </button>
      {open && (
        <div style={{position:'absolute', right:0, marginTop:8, background:'#fff', border:'1px solid #ddd', padding:8, borderRadius:6, minWidth:180}}>
          {auth.user ? (
            <div>
              <div style={{fontWeight:600}}>{auth.user.displayName || auth.user.username}</div>
              <div style={{fontSize:12, color:'#666'}}>{auth.user.role}</div>
              <hr />
              <div style={{display:'flex', gap:8}}>
                <button onClick={() => { setOpen(false); auth.signOut() }} style={{flex:1}}>Cerrar sesión</button>
              </div>
            </div>
          ) : (
            <div>
              <div>No has iniciado sesión</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
