import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://fmhnzooghyfltnkjiwzf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG56b29naHlmbHRua2ppd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzg3ODcsImV4cCI6MjA2MzQxNDc4N30.-5zCQNWfj9BiME2NSIwtAocIvvNn8NvY1f0CKwmeFrA'
)

let usuarioActual = null

window.login = async function () {
  const email = document.getElementById('username').value
  const password = document.getElementById('password').value

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
  document.getElementById('login').classList.add('hidden')
  document.getElementById('app').classList.remove('hidden')
  document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
  cambiarInstrumento()
  cargarHistorial()
}

window.logout = function () {
  usuarioActual = null
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
  if (!usuarioActual) return
  const instrumento = document.getElementById('instrumento').value
  const fecha = new Date().toISOString()

  const { error } = await supabase
    .from('operaciones')
    .insert([{ usuario_id: usuarioActual.id, instrumento, tipo: 'compra', estado: 'abierta', fecha }])

  if (!error) {
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
  if (data) {
    data.forEach(op => {
      const li = document.createElement('li')
      li.textContent = `${op.tipo.toUpperCase()} - ${op.instrumento} - ${op.estado} - ${new Date(op.fecha).toLocaleString()}`
      lista.appendChild(li)
    })
  }
}


window.abrirOperacion = async function () {
  if (!usuarioActual) return

  const { value: formValues } = await Swal.fire({
    title: 'Nueva operación',
    html: `
      <label>Instrumento:</label>
      <select id="instrumento-op" class="swal2-input">
        <optgroup label="Criptomonedas">
          <option value="BINANCE:BTCUSDT">BTC/USDT</option>
          <option value="BINANCE:ETHUSDT">ETH/USDT</option>
          <option value="BINANCE:BNBUSDT">BNB/USDT</option>
          <option value="BINANCE:XRPUSDT">XRP/USDT</option>
        </optgroup>
        <optgroup label="Mercado Americano">
          <option value="NASDAQ:AAPL">Apple (AAPL)</option>
          <option value="NASDAQ:TSLA">Tesla (TSLA)</option>
          <option value="NASDAQ:AMZN">Amazon (AMZN)</option>
        </optgroup>
        <optgroup label="Mercado Chino">
          <option value="NYSE:BABA">Alibaba (BABA)</option>
          <option value="NASDAQ:JD">JD.com (JD)</option>
          <option value="NYSE:NIO">NIO (NIO)</option>
        </optgroup>
      </select>
      <label>Lotaje:</label>
      <input type="number" id="lotaje" class="swal2-input" min="1" placeholder="Ej: 1" />
    `,
    confirmButtonText: 'Confirmar operación',
    focusConfirm: false,
    preConfirm: () => {
      return {
        instrumento: document.getElementById('instrumento-op').value,
        lotaje: parseFloat(document.getElementById('lotaje').value)
      }
    }
  })

  if (!formValues || isNaN(formValues.lotaje)) {
    Swal.fire('Operación cancelada', '', 'info')
    return
  }

  const fecha = new Date().toISOString()
  const costo = formValues.lotaje * 10

  if (usuarioActual.saldo < costo) {
    Swal.fire('Saldo insuficiente', 'No tienes suficiente saldo.', 'error')
    return
  }

  const { error } = await supabase
    .from('operaciones')
    .insert([{
      usuario_id: usuarioActual.id,
      instrumento: formValues.instrumento,
      tipo: 'compra',
      estado: 'abierta',
      fecha,
      lotaje: formValues.lotaje
    }])

  if (!error) {
    usuarioActual.saldo -= costo
    await supabase.from('usuarios').update({ saldo: usuarioActual.saldo }).eq('id', usuarioActual.id)
    document.getElementById('saldo').textContent = `Saldo: €${usuarioActual.saldo.toFixed(2)}`
    cambiarInstrumento(formValues.instrumento)
    cargarHistorial()
    Swal.fire('Operación abierta', `${formValues.instrumento} x${formValues.lotaje}`, 'success')
  }
}