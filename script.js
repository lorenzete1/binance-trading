import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://fmhnzooghyfltnkjiwzf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...FrA'
)

let usuarioActual = null

window.login = async function () {
  const user = document.getElementById('username').value.trim()
  const pass = document.getElementById('password').value.trim()
  console.log("Probando login con:", user, pass)

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', user)
    .eq('password', pass)
    .single()

  if (error || !data) {
    document.getElementById('login-error').textContent = 'Usuario o contraseña incorrectos'
    console.log("Error de Supabase:", error)
    return
  }

  console.log("Login exitoso:", data)
  usuarioActual = data
  document.getElementById('login').classList.add('hidden')
  document.getElementById('app').classList.remove('hidden')
  document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
  cargarHistorial()
  cambiarInstrumento()
  Swal.fire('Sesión iniciada', '', 'success')
}