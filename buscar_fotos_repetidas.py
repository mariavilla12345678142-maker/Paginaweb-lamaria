"""
Busca fotos repetidas y casi iguales en una carpeta y las MUEVE (no borra)
a una subcarpeta "_REPETIDAS". Al final escribe un informe con qué se movió
y cuál se dejó.

Uso:
    pip install Pillow
    python buscar_fotos_repetidas.py "C:\\Users\\TU_USUARIO\\OneDrive\\ALOJAMIENTO RESERVA NATURAL LA MARIA\\FOTOS"

Opciones:
    --simular      Solo muestra lo que haría, sin mover nada (recomendado la 1ª vez)
    --umbral N     Tolerancia para "casi iguales" (por defecto 6; más alto = más permisivo)
"""
import argparse
import hashlib
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

EXTENSIONES = {".jpg", ".jpeg", ".png", ".heic", ".webp", ".bmp", ".tif", ".tiff", ".gif"}
CARPETA_REPETIDAS = "_REPETIDAS"

try:  # Soporte opcional para fotos HEIC de iPhone: pip install pillow-heif
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass


def sha256(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def huella_visual(img):
    """dHash de 64 bits: igual para la misma foto en distinto tamaño o compresión."""
    g = img.convert("L").resize((9, 8), Image.LANCZOS)
    p = [g.getpixel((x, y)) for y in range(8) for x in range(9)]
    bits = 0
    for fila in range(8):
        for col in range(8):
            bits = (bits << 1) | (p[fila * 9 + col] > p[fila * 9 + col + 1])
    return bits


def distancia(a, b):
    return bin(a ^ b).count("1")


def leer_foto(ruta):
    with Image.open(ruta) as img:
        img = ImageOps.exif_transpose(img)  # respeta la rotación del móvil
        return img.size[0] * img.size[1], huella_visual(img)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("carpeta")
    ap.add_argument("--simular", action="store_true")
    ap.add_argument("--umbral", type=int, default=6)
    args = ap.parse_args()

    raiz = Path(args.carpeta)
    if not raiz.is_dir():
        sys.exit(f"No existe la carpeta: {raiz}")
    destino = raiz / CARPETA_REPETIDAS

    fotos = sorted(
        p for p in raiz.rglob("*")
        if p.is_file() and p.suffix.lower() in EXTENSIONES and CARPETA_REPETIDAS not in p.parts
    )
    print(f"Analizando {len(fotos)} fotos...")

    datos = []
    for p in fotos:
        try:
            pixeles, huella = leer_foto(p)
        except Exception as e:
            print(f"  (no se pudo leer {p.name}: {e})")
            continue
        datos.append({"ruta": p, "sha": sha256(p), "pixeles": pixeles,
                      "huella": huella, "bytes": p.stat().st_size})

    # Agrupa: primero idénticas por contenido, luego casi iguales por huella visual
    grupos, asignado = [], set()
    for i, a in enumerate(datos):
        if i in asignado:
            continue
        grupo = [(a, "original")]
        asignado.add(i)
        for j in range(i + 1, len(datos)):
            if j in asignado:
                continue
            b = datos[j]
            if a["sha"] == b["sha"]:
                grupo.append((b, "idéntica"))
            elif distancia(a["huella"], b["huella"]) <= args.umbral:
                grupo.append((b, "casi igual"))
            else:
                continue
            asignado.add(j)
        if len(grupo) > 1:
            grupos.append(grupo)

    lineas = []
    movidas = 0
    for n, grupo in enumerate(grupos, 1):
        # Se queda la de mayor resolución (y, a igualdad, la de mayor tamaño de archivo)
        grupo.sort(key=lambda t: (t[0]["pixeles"], t[0]["bytes"]), reverse=True)
        queda = grupo[0][0]
        lineas.append(f"\nGrupo {n}")
        lineas.append(f"  SE QUEDA : {queda['ruta'].relative_to(raiz)}")
        for d, _ in grupo[1:]:
            tipo = "idéntica" if d["sha"] == queda["sha"] else "casi igual"
            rel = d["ruta"].relative_to(raiz)
            nuevo = destino / rel
            n_extra = 1
            while nuevo.exists():
                nuevo = nuevo.with_name(f"{nuevo.stem}_{n_extra}{nuevo.suffix}")
                n_extra += 1
            lineas.append(f"  MOVIDA   : {rel}  ({tipo})  ->  {nuevo.relative_to(raiz)}")
            if not args.simular:
                nuevo.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(d["ruta"]), str(nuevo))
            movidas += 1

    resumen = (f"{'[SIMULACIÓN] ' if args.simular else ''}"
               f"{len(grupos)} grupos, {movidas} fotos {'se moverían' if args.simular else 'movidas'} a {CARPETA_REPETIDAS}")
    texto = resumen + "\n" + "\n".join(lineas)
    print(texto)
    informe = raiz / ("informe_repetidas_SIMULACION.txt" if args.simular else "informe_repetidas.txt")
    informe.write_text(texto, encoding="utf-8")
    print(f"\nInforme guardado en: {informe}")


if __name__ == "__main__":
    main()
