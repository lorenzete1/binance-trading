import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://fmhnzooghyfltnkjiwzf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG56b29naHlmbHRua2ppd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzg3ODcsImV4cCI6MjA2MzQxNDc4N30.-5zCQNWfj9BiME2NSIwtAocIvvNn8NvY1f0CKwmeFrA'
)

let usuarioActual = null

window.addEventListener('DOMContentLoaded', async () => {
  const savedEmail = localStorage.getItem('email')
  const savedPassword = localStorage.getItem('password')
  if (savedEmail && savedPassword) {
    await login(savedEmail, savedPassword)
  }
})

async function login(email = null, password = null) {
  if (!email || !password) {
    email = document.getElementById('username').value
    password = document.getElementById('password').value
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single()

  if (error || !data) {
    document.getElementById('login-error').textContent = 'Credenciales incorrectas'
    return
  }

  usuarioActual = data
  localStorage.setItem('email', email)
  localStorage.setItem('password', password)
  document.getElementById('login').classList.add('hidden')
  document.getElementById('app').classList.remove('hidden')
  document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
  cambiarInstrumento()
  cargarHistorial()
}
window.login = login

window.logout = function () {
  localStorage.removeItem('email');
  localStorage.removeItem('password');
  document.getElementById('app').classList.add('hidden')
  document.getElementById('login').classList.remove('hidden')
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
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    locale: 'es',
    toolbar_bg: '#f1f3f6',
    enable_publishing: false,
    hide_top_toolbar: true,
    hide_side_toolbar: false,
    allow_symbol_change: true,
  })
}

window.abrirOperacion = async function () {
  const instrumento = document.getElementById('instrumento').value
  const fecha = new Date().toISOString()
  const costo = 10

  if (usuarioActual.saldo < costo) {
    Swal.fire('Saldo insuficiente', '', 'error')
    return
  }

  const { error } = await supabase
    .from('operaciones')
    .insert([{ usuario_id: usuarioActual.id, instrumento, tipo: 'compra', estado: 'abierta', fecha }])

  if (!error) {
    usuarioActual.saldo -= costo
    await supabase.from('usuarios').update({ saldo: usuarioActual.saldo }).eq('id', usuarioActual.id)
    document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
    await cargarHistorial()
  }
}

window.cerrarOperacion = async function () {
  const instrumento = document.getElementById('instrumento').value
  const fecha = new Date().toISOString()
  const ganancia = 15

  const { error } = await supabase
    .from('operaciones')
    .insert([{ usuario_id: usuarioActual.id, instrumento, tipo: 'venta', estado: 'cerrada', fecha }])

  if (!error) {
    usuarioActual.saldo += ganancia
    await supabase.from('usuarios').update({ saldo: usuarioActual.saldo }).eq('id', usuarioActual.id)
    document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
    await cargarHistorial()
  }
}

window.retirarFondos = async function () {
  const cantidad = 20
  usuarioActual.saldo -= cantidad
  await supabase.from('usuarios').update({ saldo: usuarioActual.saldo }).eq('id', usuarioActual.id)
  document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
}

async function cargarHistorial(orden = 'fecha.desc') {
  const { data } = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuarioActual.id)
    .order(orden.split('.')[0], { ascending: orden.split('.')[1] !== 'desc' })

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

window.organizarHistorial = function () {
  Swal.fire({
    title: 'Ordenar historial por...',
    input: 'select',
    inputOptions: {
      'fecha.desc': 'Fecha descendente',
      'fecha.asc': 'Fecha ascendente',
      'instrumento.asc': 'Instrumento A-Z',
      'tipo.asc': 'Tipo de operación'
    },
    inputPlaceholder: 'Selecciona un criterio',
    showCancelButton: true,
  }).then(result => {
    if (result.value) {
      cargarHistorial(result.value)
    }
  })
}