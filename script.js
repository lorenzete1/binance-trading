import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://fmhnzooghyfltnkjiwzf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...FrA'
const supabase = createClient(supabaseUrl, supabaseKey)

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

  cargarHistorial()

  if (usuarioActual.es_admin) {
    const adminPanel = document.createElement('button')
    adminPanel.textContent = 'Zona Admin'
    adminPanel.onclick = abrirZonaAdmin
    document.querySelector('header').appendChild(adminPanel)
  }

  mostrarFormularioCambioPassword()
}

function mostrarFormularioCambioPassword() {
  const contenedor = document.createElement('div')
  contenedor.innerHTML = `
    <h3>Cambiar contraseña</h3>
    <input type="password" id="nuevaPassword" placeholder="Nueva contraseña" />
    <button onclick="cambiarPassword()">Guardar</button>
    <p id="cambio-pass-msg"></p>
  `
  document.getElementById('app').appendChild(contenedor)
}

window.cambiarPassword = async function () {
  const nuevaPassword = document.getElementById('nuevaPassword').value
  const { error } = await supabase
    .from('usuarios')
    .update({ password: nuevaPassword })
    .eq('id', usuarioActual.id)

  document.getElementById('cambio-pass-msg').textContent = error
    ? 'Error al cambiar contraseña'
    : 'Contraseña actualizada correctamente'
}

window.abrirOperacion = async function () {
  const instrumento = document.getElementById('instrumento').value
  const fecha = new Date().toISOString()

  const { error } = await supabase
    .from('operaciones')
    .insert([{ usuario_id: usuarioActual.id, instrumento, tipo: 'compra', fecha, estado: 'abierta' }])

  if (!error) {
    await actualizarSaldo(-10)
    cargarHistorial()
  }
}

window.cerrarOperacion = async function () {
  const instrumento = document.getElementById('instrumento').value

  const { data: abiertas } = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuarioActual.id)
    .eq('instrumento', instrumento)
    .eq('estado', 'abierta')
    .order('fecha', { ascending: false })
    .limit(1)

  if (abiertas.length > 0) {
    const idOperacion = abiertas[0].id

    const { error } = await supabase
      .from('operaciones')
      .update({ estado: 'cerrada', fecha_cierre: new Date().toISOString() })
      .eq('id', idOperacion)

    if (!error) {
      await actualizarSaldo(15)
      cargarHistorial()
    }
  }
}

window.retirarFondos = async function () {
  await actualizarSaldo(-20)
}

async function actualizarSaldo(cambio) {
  const nuevoSaldo = usuarioActual.saldo + cambio
  const { error } = await supabase
    .from('usuarios')
    .update({ saldo: nuevoSaldo })
    .eq('id', usuarioActual.id)

  if (!error) {
    usuarioActual.saldo = nuevoSaldo
    document.getElementById('saldo').textContent = `Saldo: €${nuevoSaldo.toFixed(2)}`
  }
}

async function cargarHistorial() {
  const { data } = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuarioActual.id)
    .order('fecha', { ascending: false })

  const lista = document.getElementById('historial')
  lista.innerHTML = ''
  data.forEach(op => {
    const li = document.createElement('li')
    li.textContent = `${op.tipo.toUpperCase()} - ${op.instrumento} - ${op.estado.toUpperCase()} - ${new Date(op.fecha).toLocaleString()}`
    lista.appendChild(li)
  })
}

function abrirZonaAdmin() {
  alert('Aquí podrás editar operaciones y saldos manualmente (a implementar)')
}

window.cambiarInstrumento = function () {
  const instrumento = document.getElementById('instrumento').value
  document.getElementById('tradingview-widget').innerHTML = ''

  new TradingView.widget({
    container_id: 'tradingview-widget',
    width: '100%',
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

window.addEventListener('load', () => {
  cambiarInstrumento()
})