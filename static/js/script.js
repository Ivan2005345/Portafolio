// ===== Elementos de la página =====
const modal = document.getElementById("modal");
const panel = modal.querySelector(".modal-panel");
const tituloModal = document.getElementById("modal-titulo");
const contenidoModal = document.getElementById("modal-contenido");
const botonCerrar = document.getElementById("modal-cerrar");
const rutaDocs = document.body.dataset.docs; // "/static/docs/"

let ultimoEnfocado = null; // para devolver el foco al cerrar

// ===== Abrir y cerrar la ventana =====
function abrirModal(idSeccion) {
    const plantilla = document.getElementById(idSeccion);
    if (!plantilla) return;

    tituloModal.textContent = plantilla.dataset.titulo;
    contenidoModal.replaceChildren(plantilla.content.cloneNode(true));
    contenidoModal.scrollTop = 0;

    ultimoEnfocado = document.activeElement;
    modal.classList.add("abierto");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-abierto");
    botonCerrar.focus();
}

function cerrarModal() {
    modal.classList.remove("abierto");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-abierto");

    if (ultimoEnfocado) ultimoEnfocado.focus();

    // Vacía el contenido cuando termina la animación de cierre
    setTimeout(() => {
        if (!modal.classList.contains("abierto")) {
            contenidoModal.replaceChildren();
        }
    }, 300);
}

// ===== Tarjetas, insignias y botón del CV: todo lo que tenga data-seccion =====
document.querySelectorAll("[data-seccion]").forEach((elemento) => {
    elemento.addEventListener("click", () => abrirModal(elemento.dataset.seccion));
});

// ===== Formas de cerrar =====
botonCerrar.addEventListener("click", cerrarModal);

// Clic en el fondo oscuro (fuera del panel)
modal.addEventListener("click", (evento) => {
    if (evento.target === modal) cerrarModal();
});

document.addEventListener("keydown", (evento) => {
    if (!modal.classList.contains("abierto")) return;

    // Escape cierra la ventana
    if (evento.key === "Escape") {
        cerrarModal();
        return;
    }

    // Tab no se escapa de la ventana mientras está abierta
    if (evento.key === "Tab") {
        const enfocables = panel.querySelectorAll("a[href], button:not([disabled])");
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];

        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primero.focus();
        }
    }
});

// ===== Certificados =====
contenidoModal.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-archivo]");
    if (boton) mostrarCertificado(boton);
});

async function mostrarCertificado(boton) {
    const archivo = boton.dataset.archivo;
    const url = rutaDocs + encodeURIComponent(archivo);

    // Busca (o crea) el espacio donde se muestra el documento (uno por certificado)
    const tarjeta = boton.parentElement;
    let visor = tarjeta.querySelector(".visor");
    if (!visor) {
        visor = document.createElement("div");
        visor.className = "visor";
        tarjeta.appendChild(visor);
    }

    // Comprueba si el archivo existe en static/docs/
    let existe = false;
    try {
        const respuesta = await fetch(url, { method: "HEAD" });
        existe = respuesta.ok;
    } catch (error) {
        existe = false;
    }

    if (!existe) {
        const aviso = document.createElement("p");
        aviso.className = "aviso";
        aviso.textContent = "Certificado pendiente de incorporar.";
        visor.replaceChildren(aviso);
        return;
    }

    const elementos = [];

    if (/\.(png|jpe?g|webp|gif)$/i.test(archivo)) {
        const imagen = document.createElement("img");
        imagen.src = url;
        imagen.alt = "Certificado";
        elementos.push(imagen);
    } else {
        const marco = document.createElement("iframe");
        marco.src = url;
        marco.title = "Certificado";
        elementos.push(marco);
    }

    const enlace = document.createElement("a");
    enlace.className = "boton";
    enlace.href = url;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.textContent = "Abrir en una pestaña nueva";
    elementos.push(enlace);

    visor.replaceChildren(...elementos);
}

// ===== Intereses: el panel cambia sin recargar la página =====
const botonesInteres = document.querySelectorAll(".interes");
const panelInteres = document.getElementById("interes-panel");

function mostrarInteres(boton) {
    botonesInteres.forEach((b) => {
        const activo = b === boton;
        b.classList.toggle("activo", activo);
        b.setAttribute("aria-pressed", String(activo));
    });

    const plantilla = document.getElementById(boton.dataset.interes);
    if (!plantilla) return;

    panelInteres.replaceChildren(plantilla.content.cloneNode(true));

    // Reinicia la animación de entrada
    panelInteres.classList.remove("cambio");
    void panelInteres.offsetWidth;
    panelInteres.classList.add("cambio");
}

botonesInteres.forEach((boton) => {
    boton.addEventListener("click", () => mostrarInteres(boton));
});

// Muestra la primera área al cargar, para que el panel no quede vacío
if (botonesInteres.length > 0) {
    mostrarInteres(botonesInteres[0]);
}

// ===== Animación suave al aparecer los elementos =====
const elementosRevelar = document.querySelectorAll(".revelar");

if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("visible");
                    observador.unobserve(entrada.target);
                }
            });
        },
        { threshold: 0.12 }
    );
    elementosRevelar.forEach((elemento) => observador.observe(elemento));
} else {
    elementosRevelar.forEach((elemento) => elemento.classList.add("visible"));
}

// ===== Tarjeta de identidad: descargar como PNG =====
// La imagen se dibuja con <canvas> leyendo los textos de la tarjeta en pantalla,
// así solo editas los datos en un lugar (index.html).
const botonDescargar = document.getElementById("descargar-tarjeta");
const notaTarjeta = document.getElementById("id-nota");

function rectRedondeado(ctx, x, y, ancho, alto, radio) {
    ctx.beginPath();
    ctx.moveTo(x + radio, y);
    ctx.arcTo(x + ancho, y, x + ancho, y + alto, radio);
    ctx.arcTo(x + ancho, y + alto, x, y + alto, radio);
    ctx.arcTo(x, y + alto, x, y, radio);
    ctx.arcTo(x, y, x + ancho, y, radio);
    ctx.closePath();
}

function cargarImagen(src) {
    return new Promise((resolver, rechazar) => {
        const imagen = new Image();
        imagen.onload = () => resolver(imagen);
        imagen.onerror = rechazar;
        imagen.src = src;
    });
}

async function descargarTarjeta() {
    const ANCHO = 1200;
    const ALTO = 675;
    const ESCALA = 2; // resolución final: 2400 x 1350 px
    const FUENTE = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';

    const leer = (id) => document.getElementById(id).textContent.trim();
    const iniciales = leer("id-iniciales");
    const nombre = leer("id-nombre");
    const carrera = leer("id-carrera");
    const universidad = leer("id-universidad");
    const ubicacion = leer("id-ubicacion");
    const intereses = Array.from(document.querySelectorAll("#id-intereses li"))
        .map((li) => li.textContent.trim());

    // QR (solo si el sitio está publicado y la URL está configurada en app.py)
    let imagenQR = null;
    const etiquetaQR = document.getElementById("id-qr-img");
    if (etiquetaQR) {
        try {
            imagenQR = await cargarImagen(etiquetaQR.src);
        } catch (error) {
            imagenQR = null;
        }
    }

    const canvas = document.createElement("canvas");
    canvas.width = ANCHO * ESCALA;
    canvas.height = ALTO * ESCALA;
    const ctx = canvas.getContext("2d");
    ctx.scale(ESCALA, ESCALA);

    // Fondo y resplandores
    rectRedondeado(ctx, 0, 0, ANCHO, ALTO, 36);
    ctx.clip();
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, ANCHO, ALTO);

    let degradado = ctx.createRadialGradient(140, 60, 0, 140, 60, 640);
    degradado.addColorStop(0, "rgba(139, 92, 246, 0.30)");
    degradado.addColorStop(1, "rgba(139, 92, 246, 0)");
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    degradado = ctx.createRadialGradient(1100, 640, 0, 1100, 640, 560);
    degradado.addColorStop(0, "rgba(96, 165, 250, 0.22)");
    degradado.addColorStop(1, "rgba(96, 165, 250, 0)");
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    // Borde
    rectRedondeado(ctx, 2, 2, ANCHO - 4, ALTO - 4, 34);
    ctx.strokeStyle = "rgba(139, 92, 246, 0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Iniciales en círculo
    ctx.beginPath();
    ctx.arc(140, 150, 58, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(139, 92, 246, 0.16)";
    ctx.fill();
    ctx.strokeStyle = "rgba(139, 92, 246, 0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#C4B5FD";
    ctx.font = `700 44px ${FUENTE}`;
    ctx.fillText(iniciales, 140, 153);

    // Etiqueta
    ctx.textAlign = "left";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "4px";
    ctx.font = `600 20px ${FUENTE}`;
    ctx.fillText("IDENTIDAD DIGITAL", 230, 150);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    // Nombre (se reduce si no cabe)
    ctx.textBaseline = "alphabetic";
    const anchoMaximo = imagenQR ? 760 : 1040;
    let tamano = 58;
    ctx.font = `700 ${tamano}px ${FUENTE}`;
    while (ctx.measureText(nombre).width > anchoMaximo && tamano > 30) {
        tamano -= 2;
        ctx.font = `700 ${tamano}px ${FUENTE}`;
    }
    ctx.fillStyle = "#F1F5F9";
    ctx.fillText(nombre, 80, 300);

    // Carrera, universidad y ubicación
    ctx.fillStyle = "#60A5FA";
    ctx.font = `600 32px ${FUENTE}`;
    ctx.fillText(carrera, 80, 355);

    ctx.fillStyle = "#94A3B8";
    ctx.font = `400 26px ${FUENTE}`;
    ctx.fillText(universidad, 80, 402);
    ctx.fillText(ubicacion, 80, 444);

    // Línea divisoria
    const linea = ctx.createLinearGradient(80, 0, 1120, 0);
    linea.addColorStop(0, "rgba(139, 92, 246, 0.9)");
    linea.addColorStop(0.5, "rgba(96, 165, 250, 0.6)");
    linea.addColorStop(1, "rgba(96, 165, 250, 0)");
    ctx.strokeStyle = linea;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 482);
    ctx.lineTo(1120, 482);
    ctx.stroke();

    // Áreas de interés (chips)
    ctx.font = `500 22px ${FUENTE}`;
    ctx.textBaseline = "middle";
    let x = 80;
    const yChip = 520;
    intereses.forEach((interes) => {
        const anchoChip = ctx.measureText(interes).width + 48;
        rectRedondeado(ctx, x, yChip, anchoChip, 52, 26);
        ctx.fillStyle = "rgba(96, 165, 250, 0.08)";
        ctx.fill();
        ctx.strokeStyle = "rgba(139, 92, 246, 0.55)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#F1F5F9";
        ctx.fillText(interes, x + 24, yChip + 27);
        x += anchoChip + 16;
    });

    // Código QR
    if (imagenQR) {
        rectRedondeado(ctx, 860, 130, 260, 260, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.drawImage(imagenQR, 876, 146, 228, 228);

        ctx.textAlign = "center";
        ctx.fillStyle = "#94A3B8";
        ctx.font = `400 20px ${FUENTE}`;
        ctx.fillText("Escanea para visitar mi portafolio", 990, 422);
    }

    // Descarga
    canvas.toBlob((blob) => {
        if (!blob) {
            notaTarjeta.textContent = "No se pudo generar la imagen. Inténtalo de nuevo.";
            return;
        }
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = "tarjeta-jhorman-uscategui.png";
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(enlace.href);
        notaTarjeta.textContent = "Tarjeta descargada.";
    }, "image/png");
}

if (botonDescargar) {
    botonDescargar.addEventListener("click", descargarTarjeta);
}