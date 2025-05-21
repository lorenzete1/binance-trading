import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://fmhnzooghyfltnkjiwzf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG56b29naHlmbHRua2ppd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzg3ODcsImV4cCI6MjA2MzQxNDc4N30.-5zCQNWfj9BiME2NSIwtAocIvvNn8NvY1f0CKwmeFrA'

const supabase = createClient(supabaseUrl, supabaseKey)

const supabase = supabase.createClient(
  'https://fmhnzooghyfltnkjiwzf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG56b29naHlmbHRua2ppd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzg3ODcsImV4cCI6MjA2MzQxNDc4N30.-5zCQNWfj9BiME2NSIwtAocIvvNn8NvY1f0CKwmeFrA'
);

let user = null;
let userId = null;
let saldo = 0;

async function login() {
  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    document.getElementById("login-error").textContent = "Credenciales incorrectas.";
  } else {
    user = data.user;
    userId = user.id;
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("bienvenida").textContent = "Cuenta de " + email;

    if (email === "lorenzete@proton.me") {
      document.getElementById("admin").classList.remove("hidden");
    }

    await cargarSaldo();
    await cargarHistorial();
    cargarWidget(document.getElementById("instrumento").value);
  }
}

async function registrar() {
  const email = prompt("Correo:");
  const password = prompt("Contraseña:");
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert("Error: " + error.message);
  else alert("Cuenta creada. Revisa tu correo si se requiere verificación.");
}

async function guardarNuevaPass() {
  const nuevaPass = document.getElementById("nueva-pass").value;
  const { error } = await supabase.auth.updateUser({ password: nuevaPass });
  if (error) alert("Error: " + error.message);
  else {
    alert("Contraseña actualizada.");
    document.getElementById("cambiar-pass").classList.add("hidden");
  }
}

function mostrarCambioPass() {
  document.getElementById("cambiar-pass").classList.remove("hidden");
}

async function cargarSaldo() {
  const { data } = await supabase.from("usuarios").select("saldo").eq("id", userId).single();
  saldo = data?.saldo ?? 250;
  await supabase.from("usuarios").upsert({ id: userId, saldo });
  actualizarSaldo();
}

function actualizarSaldo() {
  document.getElementById("saldo").textContent = "Saldo: €" + saldo.toFixed(2);
}

async function retirarFondos() {
  saldo = 0;
  await supabase.from("usuarios").upsert({ id: userId, saldo });
  actualizarSaldo();
  alert("Saldo retirado.");
}

async function abrirOperacion() {
  const instrumento = document.getElementById("instrumento").value;
  saldo -= 10;
  await supabase.from("usuarios").upsert({ id: userId, saldo });
  await supabase.from("operaciones").insert({ user_id: userId, tipo: "abrir", instrumento });
  await cargarHistorial();
  actualizarSaldo();
}

async function cerrarOperacion() {
  const instrumento = document.getElementById("instrumento").value;
  saldo += 5;
  await supabase.from("usuarios").upsert({ id: userId, saldo });
  await supabase.from("operaciones").insert({ user_id: userId, tipo: "cerrar", instrumento });
  await cargarHistorial();
  actualizarSaldo();
}

async function cargarHistorial() {
  const { data } = await supabase.from("operaciones").select("*").eq("user_id", userId).order("timestamp", { ascending: false });
  const historial = document.getElementById("historial");
  historial.innerHTML = "";
  data.forEach(op => {
    const li = document.createElement("li");
    li.textContent = op.tipo + " operación en " + op.instrumento;
    historial.appendChild(li);
  });
}

async function cargarAdmin() {
  const { data } = await supabase.from("operaciones").select("*").order("timestamp", { ascending: false });
  const admin = document.getElementById("admin-operaciones");
  admin.innerHTML = "";
  data.forEach(op => {
    const li = document.createElement("li");
    li.textContent = `${op.user_id} - ${op.tipo} - ${op.instrumento}`;
    admin.appendChild(li);
  });
}

function cargarWidget(ticker) {
  document.getElementById("tradingview-widget").innerHTML = "";
  new TradingView.widget({
    "container_id": "tradingview-widget",
    "autosize": true,
    "symbol": ticker,
    "interval": "D",
    "timezone": "Etc/UTC",
    "theme": "dark",
    "style": "1",
    "locale": "es",
    "toolbar_bg": "#f1f3f6",
    "enable_publishing": false,
    "allow_symbol_change": true,
    "hide_top_toolbar": false,
    "save_image": false,
    "studies": ["MACD@tv-basicstudies"],
  });
}
async function login() {
  const email = document.getElementById('username').value
  const password = document.getElementById('password').value

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single()

  if (user) {
    localStorage.setItem('usuario_id', user.id)
    localStorage.setItem('es_admin', user.es_admin)
    document.getElementById('login').classList.add('hidden')
    document.getElementById('app').classList.remove('hidden')
    actualizarSaldo(user.saldo)
    cargarHistorial()
  } else {
    document.getElementById('login-error').textContent = 'Usuario o contraseña incorrectos'
  }
}

function actualizarSaldo(saldo) {
  docum
async function abrirOperacion() {
  const usuario_id = localStorage.getItem('usuario_id')
  const instrumento = document.getElementById('instrumento').value
  const tipo = 'compra'
  const cantidad = 1

  const precio_entrada = await obtenerPrecioActual(instrumento)
  const costo = cantidad * precio_entrada

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', usuario_id)
    .single()

  if (usuario.saldo >= costo) {
    await supabase.from('operaciones').insert([{
      usuario_id, instrumento, tipo, cantidad, precio_entrada, abierta: true, fecha_apertura: new Date().toISOString()
    }])

    await supabase
      .from('usuarios')
      .update({ saldo: usuario.saldo - costo })
      .eq('id', usuario_id)

    actualizarSaldo(usuario.saldo - costo)
    cargarHistorial()
  } else {
    alert('Saldo insuficiente.')
  }
}
async function cerrarOperacion() {
  const usuario_id = localStorage.getItem('usuario_id')

  const { data: abiertas } = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuario_id)
    .eq('abierta', true)

  if (!abiertas.length) {
    alert('No hay operaciones abiertas.')
    return
  }

  const operacion = abiertas[0]
  const precio_salida = await obtenerPrecioActual(operacion.instrumento)
  const ganancia = (precio_salida - operacion.precio_entrada) * operacion.cantidad

  await supabase
    .from('operaciones')
    .update({
      abierta: false,
      precio_salida,
      fecha_cierre: new Date().toISOString()
    })
    .eq('id', operacion.id)

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', usuario_id)
    .single()

  const nuevoSaldo = usuario.saldo + operacion.cantidad * precio_salida
  await supabase.from('usuarios').update({ saldo: nuevoSaldo }).eq('id', usuario_id)

  actualizarSaldo(nuevoSaldo)
  cargarHistorial()
}
async function obtenerPrecioActual(instrumento) {
  const preciosSimulados = {
    'BTCUSD': 27000,
    'ETHUSD': 1800,
    'AAPL': 150,
    'EURUSD': 1.08
  }
  return preciosSimulados[instrumento] || 1
}
async function cargarHistorial() {
  const usuario_id = localStorage.getItem('usuario_id')
  const { data: operaciones } = await supabase
    .from('operaciones')
    .select('*')
    .eq('usuario_id', usuario_id)
    .order('fecha_apertura', { ascending: false })

  const lista = document.getElementById('historial')
  lista.innerHTML = ''
  operaciones.forEach(op => {
    const item = document.createElement('li')
    item.textContent = `${op.instrumento} - ${op.tipo.toUpperCase()} - ${op.precio_entrada} → ${op.precio_salida || 'Abierta'}`
    lista.appendChild(item)
  })
}
