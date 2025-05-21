let saldo = 250;
let operacionAbierta = null;

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === "Mario" && pass === "Aa123456") {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    cargarWidget(document.getElementById("instrumento").value);
  } else {
    document.getElementById("login-error").textContent = "Usuario o contraseña incorrectos.";
  }
}

function actualizarSaldo() {
  document.getElementById("saldo").textContent = `Saldo: €${saldo.toFixed(2)}`;
}

function retirarFondos() {
  alert(`Has retirado €${saldo.toFixed(2)} a tu cuenta bancaria. ¡Gracias por usar Binance Trading!`);
  saldo = 0;
  actualizarSaldo();
}

function abrirOperacion() {
  if (operacionAbierta) {
    alert("Ya hay una operación abierta.");
    return;
  }

  const instrumento = document.getElementById("instrumento").value;
  operacionAbierta = {
    instrumento,
    precio: obtenerPrecioActual()
  };

  agregarHistorial(`Abierta operación en ${instrumento} a €${operacionAbierta.precio.toFixed(2)}`);
}

function cerrarOperacion() {
  if (!operacionAbierta) {
    alert("No hay ninguna operación abierta.");
    return;
  }

  const precioCierre = obtenerPrecioActual();
  const ganancia = (Math.random() - 0.5) * 20; // valor simulado
  saldo += ganancia;
  actualizarSaldo();

  agregarHistorial(`Cerrada operación en ${operacionAbierta.instrumento} a €${precioCierre.toFixed(2)} (${ganancia >= 0 ? "+" : ""}${ganancia.toFixed(2)}€)`);

  operacionAbierta = null;
}

function agregarHistorial(texto) {
  const li = document.createElement("li");
  li.textContent = texto;
  document.getElementById("historial").appendChild(li);
}

function obtenerPrecioActual() {
  return 100 + Math.random() * 1000; // Simulación
}

function cambiarInstrumento() {
  const nuevo = document.getElementById("instrumento").value;
  cargarWidget(nuevo);
}

function cargarWidget(simbolo) {
  document.getElementById("tradingview-widget").innerHTML = ""; // Limpiar

  new TradingView.widget({
    container_id: "tradingview-widget",
    width: "100%",
    height: 400,
    symbol: simbolo,
    interval: "5",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "es",
    toolbar_bg: "#1e1e1e",
    enable_publishing: false,
    allow_symbol_change: true,
    hide_side_toolbar: false,
    withdateranges: true,
  });
}
