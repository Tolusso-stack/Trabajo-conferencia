// ===== Configuración =====
// Obtené tu clave gratis en https://aistudio.google.com/apikey
// OJO: si subís el proyecto a GitHub, esta clave queda visible. Usá una clave sin datos sensibles.
const API_KEY = "TU_API_KEY_AQUI";
const MODELO = "gemini-2.5-flash"; // si deja de estar disponible, revisá la lista de modelos en AI Studio
const URL_API = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;
const CLAVE_HISTORIAL = "historialDeclaraciones";
const MAXIMO_HISTORIAL = 3;

// ===== Elementos del DOM =====
const formulario = document.getElementById("formulario");
const selectorRol = document.getElementById("rol");
const campoTema = document.getElementById("tema");
const selectorSituacion = document.getElementById("situacion");
const selectorTono = document.getElementById("tono");
const botonGenerar = document.getElementById("botonGenerar");
const botonCopiar = document.getElementById("botonCopiar");
const mensajeError = document.getElementById("mensajeError");
const indicadorCarga = document.getElementById("cargando");
const seccionResultado = document.getElementById("resultado");
const textoGenerado = document.getElementById("textoGenerado");
const seccionHistorial = document.getElementById("seccionHistorial");
const listaHistorial = document.getElementById("listaHistorial");

// ===== Prompt dinámico =====
// Combina lo que eligió el usuario en una sola instrucción para la IA
function construirPrompt(momento, rol, tema, situacion, tono) {
  const textoMomento = momento === "previa"
    ? "ANTES del partido (conferencia de prensa previa)"
    : "DESPUÉS del partido (conferencia de prensa posterior)";
  const textoSituacion = situacion ? `Situación: ${situacion}.` : "";

  return `Sos un ${rol} profesional de fútbol en una conferencia de prensa ${textoMomento}.
Hablá desde la perspectiva propia de tu rol (lo que ve, vive y siente alguien en esa posición).
Tema o pregunta del periodista: ${tema}.
${textoSituacion}
Tono: ${tono}.
Redactá una respuesta en primera persona, de 3 a 5 oraciones, con lenguaje natural de futbolista.
Evitá polémicas, insultos y críticas al árbitro o a rivales. Devolvé solo el texto de la declaración.`;
}

// ===== Petición a la API de Gemini =====
async function pedirMensajeAGemini(prompt) {
  // POST con fetch: la clave va en el header y el prompt en el cuerpo (contents → parts → text)
  const respuesta = await fetch(URL_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const datos = await respuesta.json();

  // Si la API devuelve error (clave inválida, cuota, etc.) lo lanzamos para que lo capture el catch
  if (!respuesta.ok) {
    throw new Error(datos.error?.message || "La API respondió con un error.");
  }

  // El texto generado está en candidates[0].content.parts[0].text
  const texto = datos.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error("La IA no devolvió ningún texto. Probá de nuevo.");
  return texto.trim();
}

// ===== Interfaz =====
function mostrarError(texto) {
  mensajeError.textContent = texto;
  mensajeError.hidden = false;
}

function limpiarError() {
  mensajeError.hidden = true;
}

function mostrarResultado(texto) {
  textoGenerado.textContent = texto; // textContent evita inyectar HTML
  seccionResultado.hidden = false;
}

// ===== Historial (localStorage) =====
function leerHistorial() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || [];
  } catch {
    return [];
  }
}

function guardarEnHistorial(entrada) {
  // Agrega al principio y conserva solo los últimos 3
  const historial = [entrada, ...leerHistorial()].slice(0, MAXIMO_HISTORIAL);
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
  dibujarHistorial();
}

function dibujarHistorial() {
  const historial = leerHistorial();
  listaHistorial.innerHTML = "";
  seccionHistorial.hidden = historial.length === 0;

  historial.forEach((entrada) => {
    const item = document.createElement("li");
    const etiqueta = document.createElement("small");
    const nombreRol = entrada.rol || "Jugador"; // entradas viejas no tienen rol
    etiqueta.textContent = `${nombreRol} · ${entrada.momento === "previa" ? "Previa" : "Posterior"} · ${entrada.tono}`;
    const resumen = document.createElement("span");
    resumen.textContent = entrada.tema;
    item.append(etiqueta, resumen);
    item.addEventListener("click", () => mostrarResultado(entrada.texto));
    listaHistorial.appendChild(item);
  });
}

// ===== Eventos =====
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limpiarError();

  const tema = campoTema.value.trim();
  const momento = formulario.elements["momento"].value;
  const tono = selectorTono.value;
  const rol = selectorRol.value;
  const situacion = selectorSituacion.value;

  // Validación: campo vacío
  if (!tema) {
    mostrarError("Escribí el tema o la pregunta del periodista antes de generar.");
    campoTema.focus();
    return;
  }

  // Estado de carga
  botonGenerar.disabled = true;
  indicadorCarga.hidden = false;
  seccionResultado.hidden = true;

  try {
    const prompt = construirPrompt(momento, rol, tema, situacion, tono);
    const texto = await pedirMensajeAGemini(prompt);
    mostrarResultado(texto);
    guardarEnHistorial({ momento, rol, tema, tono, texto });
  } catch (error) {
    mostrarError(`No se pudo generar la declaración: ${error.message}`);
  } finally {
    // Siempre se ejecuta, haya salido bien o mal
    botonGenerar.disabled = false;
    indicadorCarga.hidden = true;
  }
});

botonCopiar.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(textoGenerado.textContent);
    botonCopiar.textContent = "¡Copiado!";
    setTimeout(() => (botonCopiar.textContent = "Copiar texto"), 1800);
  } catch {
    mostrarError("No se pudo copiar. Seleccioná el texto y copialo manualmente.");
  }
});

// Al cargar la página, mostramos el historial guardado
dibujarHistorial();
