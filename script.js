import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://fmhnzooghyfltnkjiwzf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG56b29naHlmbHRua2ppd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzg3ODcsImV4cCI6MjA2MzQxNDc4N30.-5zCQNWfj9BiME2NSIwtAocIvvNn8NvY1f0CKwmeFrA'
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
  const fecha = new Date().toISOString()

  const { error } = await supabase
    .from('operaciones')
    .insert([{ usuario_id: usuarioActual.id, instrumento, tipo: 'venta', fecha, estado: 'cerrada' }])

  if (!error) {
    await actualizarSaldo(15)
    cargarHistorial()
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
  const { data, error } = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuarioActual.id)
    .order('fecha', { ascending: false })

  if (error || !data) return

  const lista = document.getElementById('historial')
  lista.innerHTML = ''
  data.forEach(op => {
    const li = document.createElement('li')
    li.textContent = `${op.tipo.toUpperCase()} - ${op.instrumento} - ${new Date(op.fecha).toLocaleString()} - ${op.estado}`
    lista.appendChild(li)
  })
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