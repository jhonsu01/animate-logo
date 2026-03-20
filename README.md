<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Rust-vtracer-DEA584?style=for-the-badge&logo=rust&logoColor=white" />
  <img src="https://img.shields.io/badge/anime.js-v4.3-FF6F61?style=for-the-badge" />
  <img src="https://img.shields.io/badge/vivus-v0.4-7C4DFF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" />
</p>

# AnimateLogo

> Convierte cualquier imagen a SVG vectorial, animala con +20 transiciones profesionales y descargala como logo animado. Todo local, sin subir datos a la nube.

<p align="center">
  <strong>Imagen raster</strong> &xrarr; <strong>SVG vectorial</strong> &xrarr; <strong>Animacion</strong> &xrarr; <strong>Descarga</strong>
</p>

---

## Demo

```
Sube imagen (drag & drop)  -->  Elige preset de conversion  -->  Selecciona animacion  -->  Descarga SVG/GIF
```

| Paso | Descripcion |
|:----:|-------------|
| **1** | Arrastra o selecciona una imagen (PNG, JPG, BMP, GIF, WebP, TIFF) |
| **2** | Configura la conversion vectorial (preset o parametros manuales) |
| **3** | Elige entre 20 animaciones y ajusta duracion, easing, delay y loop |
| **4** | Descarga como SVG animado, SVG estatico o GIF |

---

## Caracteristicas principales

- **Conversion vectorial de alta calidad** — Usa [vtracer](https://github.com/visioncortex/vtracer) (algoritmo O(n), mas compacto que Adobe Illustrator Image Trace)
- **+20 animaciones listas para usar** — Draw, Fade, Scale, Rotate, Slide, Stagger, Elastic, Bounce, Flip, Typewriter
- **Controles avanzados** — Duracion, delay, 7 tipos de easing, loop, resolucion de exportacion (1x a 4x)
- **Conversion configurable** — 3 presets rapidos (BW, Poster, Photo) + 8 parametros ajustables
- **Exportacion multiple** — SVG animado con CSS embebido, SVG estatico, GIF animado
- **Drag & Drop** — Sube imagenes arrastrando al navegador
- **100% local** — Tu imagen nunca sale de tu maquina
- **Sin frameworks** — Frontend vanilla JS, carga instantanea

---

## Inicio rapido

### Requisitos

- [Node.js](https://nodejs.org) v18 o superior

> El binario de vtracer (Windows) ya viene incluido en `bin/`. Para Linux/macOS ver [compilar vtracer](#compilar-vtracer-para-linuxmacos).

### Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/jhonsu01/animate-logo.git
cd animate-logo

# Instalar dependencias
npm install

# Iniciar
node server.js
```

Abre **http://localhost:3000** en tu navegador.

### Inicio rapido (Windows)

Doble clic en `start.bat` — instala dependencias automaticamente y abre el servidor.

### Inicio rapido (Linux / macOS)

```bash
chmod +x start.sh
./start.sh
```

---

## Release

Si no quieres clonar el repositorio, descarga el release comprimido:

| Archivo | Contenido |
|---------|-----------|
| `animate-logo-v1.0.0.tar.gz` | App completa + binario vtracer (Windows) |

```bash
# Descargar y descomprimir
tar -xzf animate-logo-v1.0.0.tar.gz
cd animate-logo

# Instalar y ejecutar
npm install
node server.js
```

---

## Animaciones disponibles

| Categoria | Animaciones | Motor |
|-----------|------------|-------|
| **Draw** | Dibujar, Dibujar Reversa, Dibujar Sync | vivus |
| **Fade** | Fade In, Fade In Up, Fade In Scale | anime.js |
| **Scale** | Scale Bounce, Elastic In, Bounce In | anime.js |
| **Rotate** | Rotate In, Rotate + Scale | anime.js |
| **Slide** | Slide Left, Slide Right | anime.js |
| **Stagger** | Stagger Fade, Stagger Scale, Stagger Rotate | anime.js |
| **Flip** | Flip X, Flip Y | anime.js |
| **Otros** | Typewriter | JS nativo |

Cada animacion se puede personalizar con:

| Parametro | Rango | Default |
|-----------|-------|---------|
| Duracion | 300 - 5000 ms | 1500 ms |
| Delay | 0 - 2000 ms | 0 ms |
| Easing | 7 funciones (Quad, Elastic, Bounce, Cubic, Expo, Back, Linear) | Ease In Out Quad |
| Loop | Una vez, 2x, 3x, Infinito | Una vez |

---

## Opciones de conversion vectorial

### Presets rapidos

| Preset | Uso ideal | Descripcion |
|--------|----------|-------------|
| **BW** | Logos monocromaticos, iconos | Blanco y negro, bordes limpios |
| **Poster** | Logos a color, ilustraciones | Color completo, buena definicion |
| **Photo** | Fotografias, gradientes | Mas capas de color, suavizado alto |

### Parametros manuales

| Parametro | Descripcion | Rango |
|-----------|-------------|-------|
| Modo Color | Color completo o Blanco y Negro | `color` / `bw` |
| Modo Curvas | Spline (suave), Poligono, Pixel | `spline` / `polygon` / `pixel` |
| Precision Color | Bits significativos por canal RGB | 1 - 8 |
| Filtro Speckle | Eliminar manchas menores a NxN px | 0 - 16 |
| Gradiente | Diferencia de color entre capas | 0 - 255 |
| Umbral Esquinas | Angulo minimo para esquinas | 0 - 180 grados |
| Largo Segmento | Subdivision maxima de curvas | 3.5 - 10 |
| Jerarquico | Capas apiladas o recortadas | `stacked` / `cutout` |

---

## Formatos de exportacion

| Formato | Descripcion | Uso recomendado |
|---------|-------------|----------------|
| **SVG Animado** | SVG con `@keyframes` CSS embebidos | Web, presentaciones, HTML emails |
| **SVG Estatico** | Vector limpio sin animacion | Impresion, branding, edicion en Illustrator |
| **GIF** | Animacion rasterizada frame a frame | Redes sociales, mensajeria, previews |

Resolucion de exportacion configurable: 1x (original), 1.5x, 2x (default), 3x, 4x (ultra).

---

## Estructura del proyecto

```
animate-logo/
├── server.js               # Servidor Express (API de conversion)
├── package.json             # Dependencias Node.js
├── package-lock.json        # Lock de versiones
├── start.bat                # Inicio rapido Windows
├── start.sh                 # Inicio rapido Linux/macOS
├── .gitignore
├── bin/
│   └── vtracer.exe          # Binario de vectorizacion (Rust, precompilado)
├── public/
│   ├── index.html           # UI principal (4 pasos)
│   ├── app.js               # Logica frontend: upload, animacion, export
│   ├── style.css            # Tema oscuro, responsive
│   └── libs/
│       ├── anime.min.js     # anime.js v4.3.6
│       ├── vivus.min.js     # vivus v0.4.6
│       ├── gif.js           # Codificador GIF
│       └── gif.worker.js    # Web Worker para GIF
├── uploads/                 # Temp (auto-limpieza)
└── converted/               # Temp (auto-limpieza)
```

---

## Stack tecnico

| Capa | Tecnologia | Funcion |
|------|-----------|---------|
| **Servidor** | Node.js + Express 5 | API REST, serve estatico |
| **Upload** | Multer | Manejo de archivos multipart |
| **Formatos** | Sharp | Conversion WebP/TIFF/GIF a PNG |
| **Vectorizacion** | vtracer (Rust) | Raster a SVG, algoritmo O(n) |
| **Animacion JS** | anime.js v4 | Fade, scale, rotate, stagger, elastic, bounce |
| **Animacion SVG** | vivus v0.4 | Efecto dibujo con strokeDashoffset |
| **Export GIF** | gif.js | Captura canvas a GIF animado |
| **Frontend** | HTML/CSS/JS vanilla | Zero frameworks, carga < 200KB |

---

## Compilar vtracer para Linux/macOS

El release incluye `vtracer.exe` (Windows). Para otras plataformas:

```bash
# 1. Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Clonar y compilar
git clone https://github.com/visioncortex/vtracer.git
cd vtracer/cmdapp
cargo build --release

# 3. Copiar binario al proyecto
cp target/release/vtracer /ruta/a/animate-logo/bin/
```

---

## Configuracion

| Variable | Default | Donde |
|----------|---------|-------|
| `PORT` | `3000` | `server.js` linea 8 |
| `fileSize` | `50 MB` | `server.js` multer config |
| `timeout` | `120 s` | `server.js` execFile timeout |

---

## Solucion de problemas

| Problema | Solucion |
|----------|----------|
| `vtracer no encontrado` | Verifica que `bin/vtracer.exe` (o `bin/vtracer`) existe |
| Conversion lenta | Imagenes >5000px son pesadas. Reduce resolucion antes de subir |
| Puerto 3000 en uso | Cambia `PORT` en server.js o mata el proceso: `npx kill-port 3000` |
| GIF sale en blanco | Usa animaciones simples (Fade, Scale). Para complejas usa SVG animado |
| Error de formato | Formatos soportados: PNG, JPG, BMP, GIF, WebP, TIFF |
| `sharp` falla en install | Solo se necesita para WebP/TIFF. Formatos PNG/JPG/BMP funcionan sin sharp |

---

## Contribuir

1. Fork del repositorio
2. Crea tu branch: `git checkout -b mi-feature`
3. Commit: `git commit -m "Agrega feature"`
4. Push: `git push origin mi-feature`
5. Abre un Pull Request

---

## Licencia

MIT - Usa este proyecto como quieras.

---

## Creditos

Construido sobre estas librerias open source:

- [vtracer](https://github.com/visioncortex/vtracer) — Vectorizacion de imagenes (Rust)
- [anime.js](https://animejs.com) — Motor de animaciones JavaScript
- [vivus](https://maxwellito.github.io/vivus/) — Animacion de trazos SVG
- [gif.js](https://jnordberg.github.io/gif.js/) — Codificador GIF en el navegador
- [sharp](https://sharp.pixelplumbing.com/) — Procesamiento de imagenes Node.js
