const params = new URLSearchParams(window.location.search);
const articulosSeleccionados = params.get("articulos")?.split(",") || [];
const mitadElegida = params.get("mitad") || "primera"; // "primera" o "segunda"
let articuloActualIndex = 0;
let resultados = [];
let textoActual = "";
let temporizadorIntervalo = null;
let segundos = 0;

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

    if (segundos <= 15) barra.setAttribute("stroke", "#4caf50");
    else if (segundos <= 30) barra.setAttribute("stroke", "#ffeb3b");
    else if (segundos <= 45) barra.setAttribute("stroke", "#ff9800");
    else if (segundos <= 60) barra.setAttribute("stroke", "#f44336");
    else barra.setAttribute("stroke", "#212121");
  }, 1000);
}

function formatearArticulo(clave) {
  let base = clave.replace(/^art/, "Artículo ");
  base = base.replace(/punto(\d+)/g, ".$1");
  base = base.replace(/punto/g, ".");
  return base;
}

function generarEjercicio() {
  if (articuloActualIndex >= articulosSeleccionados.length) {
    mostrarResumenFinal();
    return;
  }

  const claveArticulo = articulosSeleccionados[articuloActualIndex];
  const texto = articulos[claveArticulo];
  textoActual = texto;

  const palabras = texto.trim().match(/[\wÁÉÍÓÚÜÑáéíóúüñ]+[.,;:]?|\S/g);
  const mitad = Math.floor(palabras.length / 2);
  const primeraMitad = palabras.slice(0, mitad).join(" ");
  const segundaMitad = palabras.slice(mitad).join(" ");

  const contenedor = document.getElementById("ejercicio");
  contenedor.innerHTML = `<h2>${formatearArticulo(claveArticulo)}</h2>`;

  const usarTemporizador = params.get("temporizador") === "1";
  if (usarTemporizador) iniciarTemporizador();
  else document.querySelector(".temporizador-circular").style.display = "none";

  const textoVisible = mitadElegida === "primera" ? segundaMitad : primeraMitad;
  const textoOculto = mitadElegida === "primera" ? primeraMitad : segundaMitad;

  contenedor.innerHTML += `
    <p><strong>Completa la ${mitadElegida} mitad del artículo:</strong></p>
    <p style="font-style: italic;">"${textoVisible}"</p>
    <textarea id="respuestaUsuario" rows="3" placeholder="Escribe aquí la mitad faltante..."></textarea>
  `;

  document.getElementById("resultado").innerHTML = "";
  document.querySelector(".comprobar").style.display = "inline-block";
}

function comprobar() {
  clearInterval(temporizadorIntervalo);
  document.querySelector(".comprobar").style.display = "none";
  const respuesta = document.getElementById("respuestaUsuario").value.trim();
  const palabrasUsuario = respuesta.split(/\s+/);
  const palabrasCorrectas = (mitadElegida === "primera"
    ? textoActual.split(/\s+/).slice(0, Math.floor(textoActual.split(/\s+/).length / 2))
    : textoActual.split(/\s+/).slice(Math.floor(textoActual.split(/\s+/).length / 2))
  );

  let correctas = 0;
  let errores = [];

  palabrasUsuario.forEach((palabra, i) => {
    const original = palabrasCorrectas[i];
    if (palabra === original) {
      correctas++;
    } else {
      errores.push({
        posicion: i + 1,
        usuario: palabra || "(vacío)",
        correcta: original,
      });
    }
  });

  const resultado = document.getElementById("resultado");
  const total = palabrasCorrectas.length;
  resultados.push({
    articulo: articulosSeleccionados[articuloActualIndex],
    correctas,
    total,
    tiempo: segundos,
    mitad: mitadElegida
  });

  const siguienteBtn = document.createElement("button");
  siguienteBtn.className = "comprobar";
  siguienteBtn.textContent =
    articuloActualIndex < articulosSeleccionados.length - 1
      ? "Siguiente artículo"
      : "Finalizar";
  siguienteBtn.onclick = () => {
    articuloActualIndex++;
    generarEjercicio();
  };

  resultado.innerHTML = `
    <p>Has acertado ${correctas}/${total} palabras en ${segundos} segundos.</p>
    <strong>Artículo completo:</strong><br>${textoActual}<br><br>
  `;

  if (errores.length > 0) {
    resultado.innerHTML += "<strong>Palabras incorrectas:</strong><ul>";
    errores.forEach((err) => {
      resultado.innerHTML += `<li>Posición ${err.posicion}: escribiste "<em>${err.usuario}</em>", debía ser "<strong>${err.correcta}</strong>"</li>`;
    });
    resultado.innerHTML += "</ul><br>";
  }

  resultado.appendChild(siguienteBtn);
}

function mostrarResumenFinal() {
  document.querySelector(".temporizador-circular").style.display = "none";
  const usarTemporizador = params.get("temporizador") === "1";
  document.querySelector(".comprobar").style.display = "none";
  const contenedor = document.getElementById("ejercicio");
  const resultado = document.getElementById("resultado");

  contenedor.innerHTML = "<h2 style='text-align:center;'>Resumen</h2>";

  if (!resultados.length) {
    resultado.innerHTML = "<p>No se han registrado resultados.</p>";
    return;
  }

  let tabla = `<table class="resumen"><thead><tr>
    <th>Artículo</th><th>Mitad</th><th>Aciertos</th><th>Total</th><th>% Aciertos</th>
    ${usarTemporizador ? "<th>Tiempo</th>" : ""}
  </tr></thead><tbody>`;

  resultados.forEach((r) => {
    const aciertos = Math.round((r.correctas / r.total) * 100);
    tabla += `<tr>
      <td>${formatearArticulo(r.articulo)}</td>
      <td>${r.mitad}</td>
      <td>${r.correctas}</td>
      <td>${r.total}</td>
      <td>${aciertos}%</td>
      ${usarTemporizador ? `<td>${formatearTiempo(r.tiempo)}</td>` : ""}
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

// Sugerencias
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
    e.preventDefault();
    const textarea = this.querySelector("textarea");
    const sugerencia = textarea.value.trim();
    if (sugerencia) {
      console.log("Sugerencia enviada:", sugerencia);
      textarea.value = "";
      mensaje.textContent = "✅ Sugerencia enviada correctamente. ¡Gracias!";
      mensaje.style.display = "block";
      setTimeout(() => {
        mensaje.style.display = "none";
        mensaje.textContent = "";
      }, 4000);
    }
  });
});

// Navegación con teclado
document.addEventListener("keydown", function (e) {
  const textarea = document.getElementById("respuestaUsuario");
  if (!textarea) return;

  if (e.key === "Enter") {
    comprobar();
    e.preventDefault();
  }
});

// Configuración inicial
const textoLegal = params.get("texto");
const tituloPagina = {
  penal: "Código Penal",
  civil: "Código Civil",
  constitucion: "Constitución Española",
};

document.title = `${tituloPagina[textoLegal] || "Modo Partido"} - Modo Partido`;
document.querySelector("h1").textContent = `Modo Partido: ${
  tituloPagina[textoLegal] || "Texto legal"
}`;

document.getElementById("volverBtn").onclick = () => {
  const volverParams = new URLSearchParams();
  volverParams.set("texto", params.get("texto"));
  volverParams.set("articulos", articulosSeleccionados.join(","));
  volverParams.set("titulo", params.get("titulo"));
  volverParams.set("mitad", mitadElegida);
  if (params.get("temporizador") === "1") {
    volverParams.set("temporizador", "1");
  }
  window.location.href = `selectorModoPartido.html?${volverParams.toString()}`;
};

// Cargar artículos
let script = document.createElement("script");
if (textoLegal === "penal") {
  script.src = "scripts/articulosCodPen.js";
} else if (textoLegal === "civil") {
  script.src = "scripts/articulosCodCiv.js";
} else if (textoLegal === "constitucion") {
  script.src = "scripts/articulosConstitucion.js";
} else {
  document.body.innerHTML = "<p>Error: texto legal no válido.</p>";
}
script.onload = () => {
  generarEjercicio(); // ✅ Inicia el primer ejercicio directamente
};
document.head.appendChild(script);
