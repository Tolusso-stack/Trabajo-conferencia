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