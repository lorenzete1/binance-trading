import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://fmhnzooghyfltnkjiwzf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG56b29naHlmbHRua2ppd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzg3ODcsImV4cCI6MjA2MzQxNDc4N30.-5zCQNWfj9BiME2NSIwtAocIvvNn8NvY1f0CKwmeFrA'
)

let usuarioActual = null

window.login = async function () {
  console.log('Login function registrada correctamente')
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

// función de historial con cierre
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
      li.innerHTML = `${op.tipo.toUpperCase()} - ${op.instrumento} - ${op.estado} - ${op.lotaje || 1} lote(s) 
        SL: ${op.stop_loss || '-'} TP: ${op.take_profit || '-'} - ${new Date(op.fecha).toLocaleString()}
        ${op.estado === 'abierta' ? '<button onclick="cerrarManualOperacion(\'' + op.id + '\', ' + (op.lotaje || 1) + ')">Cerrar</button>' : ''}`
      lista.appendChild(li)
    })
  }
}

window.cerrarManualOperacion = async function (id, lotaje = 1) {
  const { error } = await supabase
    .from('operaciones')
    .update({ estado: 'cerrada', tipo: 'venta' })
    .eq('id', id)

  if (!error) {
    const ganancia = lotaje * 15
    usuarioActual.saldo += ganancia
    await supabase
      .from('usuarios')
      .update({ saldo: usuarioActual.saldo })
      .eq('id', usuarioActual.id)

    document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
    Swal.fire('Operación cerrada', `Ganancia: €${ganancia}`, 'success')
    await cargarHistorial()
  }
}
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


// nueva versión avanzada
window.abrirOperacion = async function () {
  if (!usuarioActual) return

  const { value: formValues } = await Swal.fire({
    title: 'Nueva Operación',
    html:
      '<select id="tipo" class="swal2-input"><option value="compra">Compra</option><option value="venta">Venta</option></select>' +
      '<input id="lotaje" type="number" class="swal2-input" placeholder="Lotaje (ej: 1)">' +
      '<input id="sl" type="number" class="swal2-input" placeholder="Stop Loss (ej: 24000)">' +
      '<input id="tp" type="number" class="swal2-input" placeholder="Take Profit (ej: 28000)">',
    focusConfirm: false,
    preConfirm: () => {
      return {
        tipo: document.getElementById('tipo').value,
        lotaje: parseFloat(document.getElementById('lotaje').value),
        sl: parseFloat(document.getElementById('sl').value),
        tp: parseFloat(document.getElementById('tp').value)
      }
    }
  })

  if (!formValues || isNaN(formValues.lotaje)) return

  const instrumento = document.getElementById('instrumento').value
  const fecha = new Date().toISOString()
  const coste = formValues.lotaje * 10

  if (usuarioActual.saldo < coste) {
    Swal.fire('Saldo insuficiente', '', 'error')
    return
  }

  const { error } = await supabase
    .from('operaciones')
    .insert([{
      usuario_id: usuarioActual.id,
      instrumento,
      tipo: formValues.tipo,
      lotaje: formValues.lotaje,
      stop_loss: formValues.sl,
      take_profit: formValues.tp,
      estado: 'abierta',
      fecha
    }])

  if (!error) {
    usuarioActual.saldo -= coste
    document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
    await supabase.from('usuarios').update({ saldo: usuarioActual.saldo }).eq('id', usuarioActual.id)
    Swal.fire('Operación abierta', `${formValues.tipo} ${instrumento}`, 'success')
    playSound(formValues.tipo)
    await cargarHistorial()
  }
}
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
  if (!usuarioActual || usuarioActual.email !== 'lorenzete@proton.me') {
    Swal.fire('Acceso denegado', '', 'error')
    return
  }
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


window.verResumenSemanal = async function () {
  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
  const desdeFecha = sieteDiasAtras.toISOString();

  const { data } = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuarioActual.id)
    .gte('fecha', desdeFecha)

  let abiertas = 0, cerradas = 0, total = 0;

  data.forEach(op => {
    total++;
    if (op.estado === 'abierta') abiertas++;
    else if (op.estado === 'cerrada') cerradas++;
  });

  Swal.fire({
    title: 'Resumen semanal',
    html: `
      <p>Total operaciones: <b>${total}</b></p>
      <p>Abiertas: <b>${abiertas}</b></p>
      <p>Cerradas: <b>${cerradas}</b></p>
    `,
    icon: 'info'
  });