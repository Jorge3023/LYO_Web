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
