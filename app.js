// ===== Configuración =====
// La API Key NO va escrita en el código: se pide en el formulario y se guarda
// solo en el navegador de cada persona (localStorage). Clave gratis en https://console.groq.com/keys
const CLAVE_API_GUARDADA = "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";
const MODELO = "llama-3.3-70b-versatile"; // si deja de estar disponible, mirá console.groq.com/docs/models
const URL_API = "https://api.groq.com/openai/v1/chat/completions";
const CLAVE_HISTORIAL = "historialDeclaraciones";
const MAXIMO_HISTORIAL = 3;

// ===== Elementos del DOM =====
const formulario = document.getElementById("formulario");
const campoClaveApi = document.getElementById("claveApi");
campoClaveApi.value = localStorage.getItem(CLAVE_API_GUARDADA) || "";
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

// ===== Petición a la API de Groq =====
async function pedirMensajeAIA(prompt, claveApi) {
  // POST con fetch: la clave va en el header Authorization y el prompt en "messages"
  const respuesta = await fetch(URL_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${claveApi}`
    },
    body: JSON.stringify({
      model: MODELO,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8
    })
  });

  const datos = await respuesta.json();

  // Si la API devuelve error (clave inválida, límite de uso, etc.) lo lanzamos para que lo capture el catch
  if (!respuesta.ok) {
    throw new Error(datos.error?.message || "La API respondió con un error.");
  }

  // El texto generado está en choices[0].message.content
  const texto = datos.choices?.[0]?.message?.content;
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

  // Validación: falta la clave
  const claveApi = campoClaveApi.value.trim();
  if (!claveApi) {
    mostrarError("Pegá tu API Key de Groq antes de generar.");
    campoClaveApi.focus();
    return;
  }
  localStorage.setItem(CLAVE_API_GUARDADA, claveApi);

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
    const texto = await pedirMensajeAIA(prompt, claveApi);
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
