/* LYO — comportamiento de la página principal */
(function () {
  'use strict';

  // ---------- Mensaje para quien abra la consola ----------
  var BINARIO = '01110000 01100101 01110010 01101111 00100000 01101100 01100001 00100000 01110011 01100001 01110100 01101001 01110011 01100110 01100001 01100011 01100011 01101001 11000011 10110011 01101110 00100000 01101100 01101111 00100000 01110100 01110010 01100001 01101010 01101111 00100000 01100100 01100101 00100000 01110110 01110101 01100101 01101100 01110100 01100001';
  console.log('%c¿Intentas buscar algo pequeño, Sherlock Holmes?', 'font: 700 18px monospace; color: #E0EBE6;');
  console.log('%cMe intriga tu curiosidad. Sigue buscando, solo recuerda que...', 'font: 14px monospace; color: #B8C7BD;');
  console.log('%cLa curiosidad mató al gato,', 'font: 700 14px monospace; color: #E0EBE6;');
  console.log('%c' + BINARIO, 'font: 12px monospace; color: #5FE3E3;');

  var reducir = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- La chica TV haciendo caras ----------
  var PROB_SUSTO = 5; // % de que, en cada cambio de cara, salga una cara aterradora (0 = nunca)
  var CARAS = {};
  ['burlona', 'feliz', 'sorpresa', 'enojada', 'asustada', 'dormida', 'picara', 'estatica',
   'susto1', 'susto2', 'susto3', 'susto4', 'susto5', 'susto6', 'susto7'].forEach(function (n) {
    CARAS[n] = 'assets/caras/' + n + '.webp';
    new Image().src = CARAS[n]; // precarga para que no parpadee al cambiar
  });
  var NORMALES = ['burlona', 'feliz', 'sorpresa', 'enojada', 'asustada', 'dormida', 'picara'];
  var SUSTOS = ['susto1', 'susto2', 'susto3', 'susto4', 'susto5', 'susto6', 'susto7'];

  var tv = document.getElementById('tv');
  var actual = 'burlona';
  var temporizador;

  function mostrar(cara, susto) {
    actual = cara;
    tv.src = CARAS[cara];
    tv.className = susto ? 'tvshake' : 'tvbob';
  }
  function programar(ms, sinSusto) {
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { paso(sinSusto); }, ms);
  }
  // Cada cambio de cara: con probabilidad PROB_SUSTO% sale una cara aterradora (rápida); si no, una normal
  function paso(sinSusto) {
    var susto = !reducir && !sinSusto && Math.random() * 100 < PROB_SUSTO;
    var pool = susto ? SUSTOS : NORMALES.filter(function (c) { return c !== actual; });
    var elegida = pool[Math.floor(Math.random() * pool.length)];
    function poner() {
      mostrar(elegida, susto);
      if (susto) {
        // se queda un momento, vuelve la estática y regresa a una cara normal
        temporizador = setTimeout(function () {
          mostrar('estatica', false);
          programar(130, true);
        }, 650 + Math.random() * 450);
      } else {
        programar(2200 + Math.random() * 2400, false);
      }
    }
    if (reducir) { poner(); return; }
    mostrar('estatica', false);
    temporizador = setTimeout(poner, 90);
  }
  if (tv) programar(2500, false);

  // ---------- La chica TV se puede arrastrar (mouse o dedo) y recuerda dónde la dejaste ----------
  var caja = tv && tv.parentNode;
  if (caja) {
    var pos = null; // posición en fracciones de la ventana: [x, y]
    try { pos = JSON.parse(localStorage.getItem('lyo_tv')); } catch (e) {}
    function limitar(x, y) {
      var w = caja.offsetWidth, h = caja.offsetHeight;
      return [Math.min(Math.max(x, 0), Math.max(0, window.innerWidth - w)),
              Math.min(Math.max(y, 0), Math.max(0, window.innerHeight - h))];
    }
    function colocar(x, y) {
      var p = limitar(x, y);
      caja.style.left = p[0] + 'px';
      caja.style.top = p[1] + 'px';
    }
    function guardar() {
      try { localStorage.setItem('lyo_tv', JSON.stringify([caja.offsetLeft / window.innerWidth, caja.offsetTop / window.innerHeight])); } catch (e) {}
    }
    if (pos && pos.length === 2) colocar(pos[0] * window.innerWidth, pos[1] * window.innerHeight);
    window.addEventListener('resize', function () { colocar(caja.offsetLeft, caja.offsetTop); });

    var dx = 0, dy = 0, inicio = null, movio = false;
    tv.addEventListener('pointerdown', function (e) {
      inicio = [e.clientX, e.clientY];
      dx = e.clientX - caja.offsetLeft;
      dy = e.clientY - caja.offsetTop;
      movio = false;
      tv.setPointerCapture(e.pointerId);
      caja.classList.add('arrastrando');
      e.preventDefault();
    });
    tv.addEventListener('pointermove', function (e) {
      if (!inicio) return;
      if (Math.abs(e.clientX - inicio[0]) + Math.abs(e.clientY - inicio[1]) > 4) movio = true;
      colocar(e.clientX - dx, e.clientY - dy);
    });
    function soltar() {
      if (!inicio) return;
      inicio = null;
      caja.classList.remove('arrastrando');
      if (movio) guardar(); else programar(0, true); // un toque sin arrastrar: cambia de cara
    }
    tv.addEventListener('pointerup', soltar);
    tv.addEventListener('pointercancel', soltar);
  }

  // ---------- Estática: tras el vacío negro, la pantalla se llena de ruido y se corta antes de la terminal ----------
  var zona = document.getElementById('zona-estatica');
  var lienzo = document.getElementById('estatica');
  if (zona && lienzo && !reducir && lienzo.getContext) {
    var ctx = lienzo.getContext('2d');
    var W = lienzo.width, H = lienzo.height;
    var img = ctx.createImageData(W, H);
    var visible = false, ultimo = 0, apagon = 0;
    function suave(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function dibujar(t) {
      if (!visible) return;
      requestAnimationFrame(dibujar);
      if (t - ultimo < 42) return; // ~24 cuadros por segundo
      ultimo = t;
      var r = zona.getBoundingClientRect();
      var p = (window.innerHeight - r.top) / (r.height + window.innerHeight); // 0 → 1 mientras la zona cruza la ventana
      var fuerza = suave(0.25, 0.55, p) * (1 - suave(0.68, 0.86, p));
      if (apagon > 0) { apagon--; fuerza = 0; }
      else if (Math.random() < 0.04) apagon = 1 + Math.floor(Math.random() * 3); // cortes breves
      lienzo.style.opacity = fuerza * (0.55 + Math.random() * 0.45);
      if (fuerza <= 0) return;
      // franjas que "se rompen": más brillo y con tinte rojo o cian
      var bandas = [];
      for (var k = 0; k < 3; k++) if (Math.random() < 0.5) bandas.push([Math.floor(Math.random() * H), 2 + Math.floor(Math.random() * 9), Math.random() < 0.5 ? 0 : 1]);
      var d = img.data;
      for (var y = 0; y < H; y++) {
        var tinte = -1;
        for (var b = 0; b < bandas.length; b++) if (y >= bandas[b][0] && y < bandas[b][0] + bandas[b][1]) tinte = bandas[b][2];
        var linea = (y % 2) ? 0.82 : 1; // líneas de escaneo
        for (var x = 0; x < W; x++) {
          var i = (y * W + x) * 4;
          var v = Math.random();
          v = v * v * 255 * linea * (tinte >= 0 ? 1.5 : 0.8);
          d[i] = tinte === 0 ? Math.min(255, v * 1.2) : (tinte === 1 ? v * 0.4 : v);
          d[i + 1] = tinte === 0 ? v * 0.35 : v;
          d[i + 2] = tinte === 0 ? v * 0.35 : (tinte === 1 ? Math.min(255, v * 1.2) : v);
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var ahora = es.some(function (e) { return e.isIntersecting; });
        if (ahora && !visible) { visible = true; requestAnimationFrame(dibujar); }
        else if (!ahora) { visible = false; lienzo.style.opacity = 0; }
      }).observe(zona);
    }
  }

  // ---------- Terminal: la salida se escribe línea por línea al llegar a ella ----------
  // (una línea por segundo, igual que los time.sleep(1) del código que se ve arriba)
  var salida = document.getElementById('salida-terminal');
  function mostrarPaso(k) {
    var lineas = salida.querySelectorAll('[data-paso]');
    for (var i = 0; i < lineas.length; i++) {
      if (Number(lineas[i].getAttribute('data-paso')) <= k) lineas[i].hidden = false;
    }
  }
  function imprimir(k) {
    mostrarPaso(k);
    if (k < 5) setTimeout(function () { imprimir(k + 1); }, 1000);
  }
  if (salida) {
    if (reducir || !('IntersectionObserver' in window)) {
      mostrarPaso(5);
    } else {
      var io = new IntersectionObserver(function (entradas) {
        if (entradas.some(function (e) { return e.isIntersecting; })) {
          io.disconnect();
          imprimir(1);
        }
      }, { threshold: 0.3 });
      io.observe(salida);
    }
  }
})();
