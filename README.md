# LYO — página web

Sitio estático (HTML + CSS + JS), sin backend.

## Estructura

- `index.html` — página principal
- `css/estilo.css` — estilos (el color de acento está en `--acento`)
- `js/principal.js` — cara de la TV (`PROB_SUSTO` = % de caras aterradoras), terminal y mensaje para las herramientas de desarrollador
- `assets/` — fondo de código y caras de la TV

## Publicar con GitHub Pages

1. En el repositorio: **Settings → Pages**
2. **Build and deployment → Source: Deploy from a branch**
3. Branch: `main`, carpeta `/ (root)` → **Save**

La página queda en `https://<usuario>.github.io/LYO_Web/`.

## Probar en local

```
python3 -m http.server 8000
```

y abrir `http://localhost:8000`.
