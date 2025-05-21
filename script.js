import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://fmhnzooghyfltnkjiwzf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG56b29naHlmbHRua2ppd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzg3ODcsImV4cCI6MjA2MzQxNDc4N30.-5zCQNWfj9BiME2NSIwtAocIvvNn8NvY1f0CKwmeFrA'
)

let usuarioActual = null

window.login = async function () {
  const user = document.getElementById('username').value.trim()
  const pass = document.getElementById('password').value.trim()

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
  cambiarInstrumento()
  Swal.fire('Sesión iniciada', '', 'success')
}

window.logout = function () {
  usuarioActual = null
  document.getElementById('app').classList.add('hidden')
  document.getElementById('login').classList.remove('hidden')
  document.getElementById('username').value = ''
  document.getElementById('password').value = ''
  document.getElementById('login-error').textContent = ''
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


window.abrirOperacion = async function () {
  if (!usuarioActual) return
  const instrumento = document.getElementById('instrumento').value
  const fecha = new Date().toISOString()

  const { error } = await supabase
    .from('operaciones')
    .insert([{ usuario_id: usuarioActual.id, instrumento, tipo: 'compra', estado: 'abierta', fecha }])

  if (!error) {
    Swal.fire('Operación abierta', instrumento, 'success')
    await cargarHistorial()
  }
}

window.cerrarOperacion = async function () {
  if (!usuarioActual) return
  const instrumento = document.getElementById('instrumento').value
  const fecha = new Date().toISOString()

  const { error } = await supabase
    .from('operaciones')
    .insert([{ usuario_id: usuarioActual.id, instrumento, tipo: 'venta', estado: 'cerrada', fecha }])

  if (!error) {
    Swal.fire('Operación cerrada', instrumento, 'success')
    await cargarHistorial()
  }
}

window.retirarFondos = async function () {
  if (!usuarioActual) return
  const cantidad = 20
  const nuevoSaldo = usuarioActual.saldo - cantidad

  const { error } = await supabase
    .from('usuarios')
    .update({ saldo: nuevoSaldo })
    .eq('id', usuarioActual.id)

  if (!error) {
    usuarioActual.saldo = nuevoSaldo
    document.getElementById('saldo').textContent = `Saldo: €${nuevoSaldo.toFixed(2)}`
    Swal.fire('Retiro exitoso', `Has retirado €${cantidad}`, 'info')
  }
}


// Cambiar contraseña
window.cambiarPassword = async function () {
  const nueva = prompt("Introduce nueva contraseña:")
  if (!nueva) return
  const { error } = await supabase
    .from('usuarios')
    .update({ password: nueva })
    .eq('id', usuarioActual.id)
  if (!error) Swal.fire('Contraseña actualizada', '', 'success')
}

// Reproducir sonido
function playSound(tipo) {
  const audio = new Audio(tipo === 'compra' ? 'buy.mp3' : 'sell.mp3')
  audio.play()
}

// Panel admin
window.abrirAdmin = async function () {
  if (!usuarioActual?.es_admin) return
  const { data } = await supabase.from('usuarios').select('*')
  if (!data) return
  let html = '<h3>Panel de Administración</h3><ul>'
  for (const user of data) {
    html += `<li>${user.email} - €${user.saldo.toFixed(2)} <button onclick="editarSaldo('${user.id}')">Editar</button></li>`
  }
  html += '</ul>'
  Swal.fire({ html, width: 600 })
}

window.editarSaldo = async function (id) {
  const nuevo = prompt("Nuevo saldo:")
  const { error } = await supabase
    .from('usuarios')
    .update({ saldo: parseFloat(nuevo) })
    .eq('id', id)
  if (!error) Swal.fire('Saldo actualizado', '', 'success')
}