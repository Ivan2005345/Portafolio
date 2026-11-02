import io
import os

from flask import Flask, Response, abort, render_template

# segno genera el código QR. Es opcional: si no está instalado, el QR queda desactivado.
try:
    import segno
except ImportError:
    segno = None

app = Flask(__name__)

# ----------------------------------------------------------------
# CONFIGURACIÓN (edita solo estas dos líneas)
# ----------------------------------------------------------------
# URL pública de tu portafolio, cuando lo publiques. Ejemplo:
# URL_PUBLICA = "https://mi-portafolio.onrender.com"
# Déjala vacía mientras no esté publicado.
URL_PUBLICA = ""

# Nombre del PDF de tu hoja de vida dentro de static/docs/
ARCHIVO_CV = "hoja de vida_Jhornan Ivan Uscategui Rico.pdf"
# ----------------------------------------------------------------


def url_valida(url):
    """Solo acepta direcciones https públicas (nunca localhost)."""
    return (
        url.startswith("https://")
        and "localhost" not in url
        and "127.0.0.1" not in url
    )


@app.route("/")
def inicio():
    ruta_cv = os.path.join(app.static_folder, "docs", ARCHIVO_CV)
    return render_template(
        "index.html",
        qr_activo=bool(segno and url_valida(URL_PUBLICA)),
        cv_disponible=os.path.isfile(ruta_cv),
        archivo_cv=ARCHIVO_CV,
    )


@app.route("/qr.svg")
def qr():
    if not (segno and url_valida(URL_PUBLICA)):
        abort(404)
    buffer = io.BytesIO()
    segno.make(URL_PUBLICA, error="m").save(
        buffer, kind="svg", scale=10, border=2, dark="#111827", light="#ffffff"
    )
    return Response(buffer.getvalue(), mimetype="image/svg+xml")


if __name__ == "__main__":
    app.run(debug=True)