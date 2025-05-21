import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://fmhnzooghyfltnkjiwzf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...FrA' // clave pública real aquí
)

let usuarioActual = null

window.login = async function () {
  const user = document.getElementById('username').value
  const pass = document.getElementById('password').value

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', user)
    .eq('password', pass)
    .single()

  if (error || !data) {
    document.getElementById('login-error').textContent = 'Usuario o contraseña incorrectos'
    return
  }

  usuarioActual = data
  document.getElementById('login').classList.add('hidden')
  document.getElementById('app').classList.remove('hidden')
  document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
  showToast("Sesión iniciada correctamente")
  cargarHistorial()
  cambiarInstrumento()
}

window.abrirOperacion = async function () {
  const instrumento = document.getElementById('instrumento').value
  const fecha = new Date().toISOString()
  await supabase.from('operaciones').insert([{ usuario_id: usuarioActual.id, instrumento, tipo: 'compra', fecha, estado: 'abierta' }])
  await actualizarSaldo(-10)
  cargarHistorial()
  showToast("Operación abierta")
}

window.cerrarOperacion = async function () {
  const instrumento = document.getElementById('instrumento').value
  const abiertas = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuarioActual.id)
    .eq('instrumento', instrumento)
    .eq('estado', 'abierta')
    .limit(1)

  if (abiertas.data.length > 0) {
    const id = abiertas.data[0].id
    await supabase.from('operaciones').update({ estado: 'cerrada' }).eq('id', id)
    await actualizarSaldo(15)
    cargarHistorial()
    showToast("Operación cerrada")
  }
}

window.retirarFondos = async function () {
  await actualizarSaldo(-20)
  showToast("Fondos retirados")
}

async function actualizarSaldo(cambio) {
  const nuevoSaldo = usuarioActual.saldo + cambio
  await supabase.from('usuarios').update({ saldo: nuevoSaldo }).eq('id', usuarioActual.id)
  usuarioActual.saldo = nuevoSaldo
  document.getElementById('saldo').textContent = `Saldo: €${nuevoSaldo.toFixed(2)}`
}

async function cargarHistorial() {
  const { data } = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuarioActual.id)
    .order('fecha', { ascending: false })

  const lista = document.getElementById('historial')
  lista.innerHTML = ''
  if (data) {
    data.forEach(op => {
      const li = document.createElement('li')
      li.textContent = `${op.tipo.toUpperCase()} - ${op.instrumento} - ${op.estado} - ${new Date(op.fecha).toLocaleString()}`
      lista.appendChild(li)
    })
  }
}

window.cambiarInstrumento = function () {
  const instrumento = document.getElementById('instrumento').value
  document.getElementById('tradingview-widget').innerHTML = ''
  new TradingView.widget({
    container_id: 'tradingview-widget',
    width: "100%",
    height: 400,
    symbol: instrumento,
    interval: 'D',
    theme: 'dark',
    style: '1',
    locale: 'es',
    enable_publishing: false,
    hide_side_toolbar: false,
    allow_symbol_change: true,
    studies: ['MACD@tv-basicstudies'],
  })
}

// Notificación visual
function showToast(message) {
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.classList.remove('hidden')
  setTimeout(() => toast.classList.add('hidden'), 3000)
}