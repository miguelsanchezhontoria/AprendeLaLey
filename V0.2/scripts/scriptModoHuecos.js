const params = new URLSearchParams(window.location.search);
const articulosSeleccionados = params.get("articulos")?.split(",") || [];
let articuloActualIndex = 0;
let resultados = [];
let palabrasOriginales = [];
let indicesHuecos = [];
let textoActual = "";
let temporizadorIntervalo = null;
let segundos = 0;

const palabrasExcluidas = [
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "a",
  "con",
  "de",
  "desde",
  "en",
  "y",
  "e",
  "o",
  "u",
  "se",
  "me",
  "te",
];
// Eliminar puntuación
function limpiarPuntuacion(palabra) {
  return palabra.replace(/[.«»,;:!?¡¿()"]/g, "");
}

// Inicia el temporizador
function iniciarTemporizador() {
  clearInterval(temporizadorIntervalo);
  segundos = 0;
  const textoTiempo = document.querySelector(".tiempo-texto");
  const barra = document.getElementById("progreso");
  textoTiempo.textContent = "0s";
  barra.setAttribute("stroke-dasharray", `0, 100`);

  temporizadorIntervalo = setInterval(() => {
    segundos++;
    textoTiempo.textContent = `${segundos}s`;

    const porcentaje = Math.min(100, (segundos / 60) * 100);
    barra.setAttribute("stroke-dasharray", `${porcentaje}, 100`);

    // Cambiar color según el tramo de tiempo
    if (segundos <= 15) {
      barra.setAttribute("stroke", "#4caf50"); // verde
    } else if (segundos <= 30) {
      barra.setAttribute("stroke", "#ffeb3b"); // amarillo
    } else if (segundos <= 45) {
      barra.setAttribute("stroke", "#ff9800"); // naranja
    } else if (segundos <= 60) {
      barra.setAttribute("stroke", "#f44336"); // rojo
    } else {
      barra.setAttribute("stroke", "#212121"); // negro
    }
  }, 1000);
}

function formatearArticulo(clave) {
  let base = clave.replace(/^art/, "Artículo ");
  base = base.replace(/punto(\d+)/g, ".$1");
  base = base.replace(/punto/g, ".");
  return base;
}

function generarHuecos() {
  if (articuloActualIndex >= articulosSeleccionados.length) {
    mostrarResumenFinal();
    return;
  }
  const porcentaje = parseFloat(params.get("porcentaje") || "0.25");
  const claveArticulo = articulosSeleccionados[articuloActualIndex];
  const texto = articulos[claveArticulo];
  textoActual = texto;
  palabrasOriginales = texto.split(" ");
  indicesHuecos = [];
  const contenedor = document.getElementById("ejercicio");
  contenedor.innerHTML = `<h2>${formatearArticulo(claveArticulo)}</h2>`;
  const indicesValidos = palabrasOriginales
    .map((palabra, index) => {
      const palabraLimpia = limpiarPuntuacion(palabra.toLowerCase());

      // Excluir si es número (como "1", "2") o número con punto ("1.", "2.")
      const esNumero = /^\d+\.?$/.test(palabraLimpia);

      return !palabrasExcluidas.includes(palabraLimpia) &&
        palabraLimpia !== "" &&
        !esNumero
        ? index
        : null;
    })
    .filter((index) => index !== null);
  const numHuecos = Math.max(1, Math.floor(indicesValidos.length * porcentaje));
  while (indicesHuecos.length < numHuecos) {
    const indice =
      indicesValidos[Math.floor(Math.random() * indicesValidos.length)];
    if (!indicesHuecos.includes(indice)) indicesHuecos.push(indice);
  }
  const frase = palabrasOriginales.map((palabra, index) => {
    const puntuacionFinal = palabra.match(/[.«»,;:!?]$/);
    if (indicesHuecos.includes(index)) {
      return `<input type="text" data-index="${index}" tabindex="${index}" />${
        puntuacionFinal ? puntuacionFinal[0] : ""
      }`;
    } else {
      return palabra;
    }
  });
  contenedor.innerHTML += frase.join(" ");
  document.getElementById("resultado").innerHTML = "";
  const usarTemporizador = params.get("temporizador") === "1";
  if (usarTemporizador) {
    iniciarTemporizador(); // ✅ solo si está activado
  } else {
    document.querySelector(".temporizador-circular").style.display = "none"; // ocultar si no se usa
  }
  document.querySelector(".comprobar").style.display = "inline-block";
}

function comprobar() {
  clearInterval(temporizadorIntervalo);
  document.querySelector(".comprobar").style.display = "none";
  const inputs = document.querySelectorAll("input[type='text']");
  let correctas = 0;
  inputs.forEach((input) => {
    const index = parseInt(input.dataset.index);
    const respuestaUsuario = limpiarPuntuacion(
      input.value.trim().toLowerCase()
    );
    const palabraCorrecta = limpiarPuntuacion(
      palabrasOriginales[index].toLowerCase()
    );
    input.style.borderWidth = "5px";
    input.style.borderStyle = "solid";
    input.style.borderColor =
      respuestaUsuario === palabraCorrecta ? "green" : "red";
    if (respuestaUsuario === palabraCorrecta) correctas++;
  });

  const resultado = document.getElementById("resultado");
  const total = inputs.length;
  const claveActual = articulosSeleccionados[articuloActualIndex];
  const yaRegistrado = resultados.some((r) => r.articulo === claveActual);

  if (yaRegistrado) return;
  resultados.push({
    articulo: articulosSeleccionados[articuloActualIndex],
    correctas,
    total,
    tiempo: segundos,
    huecos: parseFloat(params.get("porcentaje") || "0.25"),
  });

  const siguienteBtn = document.createElement("button");
  siguienteBtn.className = "comprobar";
  siguienteBtn.textContent =
    articuloActualIndex < articulosSeleccionados.length - 1
      ? "Siguiente artículo"
      : "Finalizar";
  siguienteBtn.onclick = () => {
    if (articuloActualIndex < articulosSeleccionados.length - 1) {
      articuloActualIndex++;
      generarHuecos();
    } else {
      mostrarResumenFinal(); // ✅ muestra la tabla al finalizar
    }
  };

  resultado.innerHTML = `
    <p>Has acertado ${correctas}/${total} palabras en ${segundos} segundos.</p>
    <strong>Artículo completo:</strong><br>${textoActual}<br><br>
  `;
  resultado.appendChild(siguienteBtn);
}

// Mostrar resumen final
function mostrarResumenFinal() {
  document.querySelector(".comprobar").style.display = "none";
  const contenedor = document.getElementById("ejercicio");
  const resultado = document.getElementById("resultado");

  contenedor.innerHTML = "<h2 style='text-align:center;'>Resumen</h2>";

  if (!resultados.length) {
    resultado.innerHTML = "<p>No se han registrado resultados.</p>";
    return;
  }

  let tabla = `<table class="resumen"><thead><tr>
    <th>Artículo</th><th>% Huecos</th><th>Aciertos</th><th>Total</th><th>% Aciertos</th>
    ${params.get("temporizador") === "1" ? "<th>Tiempo</th>" : ""}
  </tr></thead><tbody>`;

  resultados.forEach((r) => {
    const aciertos = Math.round((r.correctas / r.total) * 100);
    const ocultado = Math.round(r.huecos * 100);
    tabla += `<tr>
      <td>${formatearArticulo(r.articulo)}</td>
      <td>${ocultado}%</td>
      <td>${r.correctas}</td>
      <td>${r.total}</td>
      <td>${aciertos}%</td>
      ${
        params.get("temporizador") === "1"
          ? `<td>${formatearTiempo(r.tiempo)}</td>`
          : ""
      }
    </tr>`;
  });

  tabla += "</tbody></table>";
  resultado.innerHTML = tabla;
  const volverBtn = document.createElement("button");
  volverBtn.textContent = "Volver";
  volverBtn.className = "btn-volver tooltip";
  volverBtn.onclick = () => {
    window.location.href = "index.html";
  };
  const tooltipText = document.createElement("span");
  tooltipText.className = "tooltip-text";
  tooltipText.textContent = "Volver a la pantalla inicial";
  volverBtn.appendChild(tooltipText);
  resultado.appendChild(volverBtn);
}

function formatearTiempo(segundos) {
  if (segundos < 60) return `${segundos} segundo${segundos === 1 ? "" : "s"}`;
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return `${min} min${
    sec > 0 ? ` y ${sec} segundo${sec === 1 ? "" : "s"}` : ""
  }`;
}

document
  .getElementById("toggleSugerencias")
  .addEventListener("click", function () {
    const box = document.getElementById("sugerenciasBox");
    box.classList.toggle("plegado");
  });

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".sugerencias-form");
  const mensaje = document.getElementById("mensajeSugerencia");
  form.addEventListener("submit", function (e) {
    e.preventDefault(); // Evita recargar la página
    const textarea = this.querySelector("textarea");
    const sugerencia = textarea.value.trim();
    if (sugerencia) {
      console.log("Sugerencia enviada:", sugerencia); // Limpiar textarea
      textarea.value = ""; // Mostrar mensaje de éxito
      mensaje.textContent = "✅ Sugerencia enviada correctamente. ¡Gracias!";
      mensaje.style.display = "block"; // Ocultar mensaje tras unos segundos (opcional)
      setTimeout(() => {
        mensaje.style.display = "none";
        mensaje.textContent = "";
      }, 4000);
    }
  });
});

document.addEventListener("keydown", function (e) {
  const inputs = Array.from(document.querySelectorAll("input[type='text']"));
  const active = document.activeElement;
  const index = inputs.indexOf(active);

  if (index === -1) return;

  if (e.key === "ArrowLeft" && index > 0) {
    inputs[index - 1].focus();
    e.preventDefault();
  }

  if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
    if (index < inputs.length - 1) {
      inputs[index + 1].focus();
    } else {
      comprobar(); // ✅ último hueco → mostrar solución
    }
    e.preventDefault();
  }
});

const textoLegal = params.get("texto");
const tituloPagina = {
  penal: "Código Penal",
  civil: "Código Civil",
  constitucion: "Constitución Española",
};

document.title = `${tituloPagina[textoLegal] || "Modo Huecos"} - Modo Huecos`;
document.querySelector("h1").textContent = `Modo Huecos: ${
  tituloPagina[textoLegal] || "Texto legal"
}`;

document.getElementById("volverBtn").onclick = () => {
  const volverParams = new URLSearchParams();
  volverParams.set("texto", params.get("texto"));
  volverParams.set("articulos", params.get("articulos"));
  volverParams.set("titulo", params.get("titulo"));
  volverParams.set("porcentaje", params.get("porcentaje"));
  if (params.get("temporizador") === "1") {
    volverParams.set("temporizador", "1");
  }
  window.location.href = `selectorModoHuecos.html?${volverParams.toString()}`;
};

let script = document.createElement("script");
if (textoLegal === "penal"  ) {
  script.src = "scripts/articulosCodPen.js";
} else if (textoLegal === "civil") {
  script.src = "scripts/articulosCodCiv.js";
} else if (textoLegal === "constitucion") {
  script.src = "scripts/articulosConstitucion.js";
} else {
  document.body.innerHTML = "<p>Error: texto legal no válido.</p>";
}
script.onload = () => {
  generarHuecos(); // ✅ Inicia el primer ejercicio directamente
};
document.head.appendChild(script);
