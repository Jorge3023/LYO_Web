/* LYO — comportamiento de la página principal */
(function () {
  'use strict';

  // ---------- Mensaje para quien abra las herramientas de desarrollador ----------
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
  var estado = 'libre'; // libre | bloqueada (chocó con la pared) | dormida (se quedó atrás) | despertando

  function mostrar(cara, susto) {
    actual = cara;
    tv.src = CARAS[cara];
    tv.className = susto ? 'tvshake' : 'tvbob';
  }
  function programar(ms, sinSusto) {
    clearTimeout(temporizador);
    if (estado !== 'libre') return;
    temporizador = setTimeout(function () { paso(sinSusto); }, ms);
  }
  // Cada cambio de cara: con probabilidad PROB_SUSTO% sale una cara aterradora (rápida); si no, una normal
  function paso(sinSusto) {
    if (estado !== 'libre') return;
    var susto = !reducir && !sinSusto && Math.random() * 100 < PROB_SUSTO;
    var pool = susto ? SUSTOS : NORMALES.filter(function (c) { return c !== actual; });
    var elegida = pool[Math.floor(Math.random() * pool.length)];
    function poner() {
      if (estado !== 'libre') return;
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
  function izq() { return parseFloat(getComputedStyle(caja).left) || 0; }
  function arr() { return parseFloat(getComputedStyle(caja).top) || 0; }
  function colocar(x, y) {
    var w = caja.offsetWidth, h = caja.offsetHeight;
    caja.style.left = Math.min(Math.max(x, 0), Math.max(0, window.innerWidth - w)) + 'px';
    caja.style.top = Math.min(Math.max(y, 0), Math.max(0, window.innerHeight - h)) + 'px';
  }
  function guardar() {
    try { localStorage.setItem('lyo_tv', JSON.stringify([izq() / window.innerWidth, arr() / window.innerHeight])); } catch (e) {}
  }
  if (caja) {
    var pos = null; // posición en fracciones de la ventana: [x, y]
    try { pos = JSON.parse(localStorage.getItem('lyo_tv')); } catch (e) {}
    if (pos && pos.length === 2) colocar(pos[0] * window.innerWidth, pos[1] * window.innerHeight);
    window.addEventListener('resize', function () { colocar(izq(), arr()); pedirBarrera(); });

    var dx = 0, dy = 0, inicio = null, movio = false;
    tv.addEventListener('pointerdown', function (e) {
      var r = caja.getBoundingClientRect(); // posición que se ve (puede estar empujada por la barrera)
      colocar(r.left, r.top);
      dx = e.clientX - r.left;
      dy = e.clientY - r.top;
      inicio = [e.clientX, e.clientY];
      movio = false;
      tv.setPointerCapture(e.pointerId);
      caja.classList.add('arrastrando');
      e.preventDefault();
    });
    tv.addEventListener('pointermove', function (e) {
      if (!inicio) return;
      if (Math.abs(e.clientX - inicio[0]) + Math.abs(e.clientY - inicio[1]) > 4) movio = true;
      var y = e.clientY - dy;
      if (zona) y = Math.min(y, zona.getBoundingClientRect().top - caja.offsetHeight); // no se puede arrastrar más allá de la barrera
      colocar(e.clientX - dx, y);
      barrera();
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
      var pf = r.height / (r.height + window.innerHeight); // p en el que el lienzo deja de pegarse a la ventana
      var fuerza = suave(0.18, 0.36, p) * (1 - suave(pf - 0.2, pf - 0.03, p));
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

  // ---------- Barrera invisible: la TV no puede entrar a la zona de la estática ----------
  // Si el usuario baja, la TV se queda parada en la pared (sobre la página); al volver a subir sigue ahí, dormida,
  // y despierta.
  var tDespertar = null, pendiente = false;
  function pedirBarrera() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () { pendiente = false; barrera(); });
  }
  window.addEventListener('scroll', pedirBarrera, { passive: true });
  function tocaBarrera(yB) { return arr() + caja.offsetHeight >= yB - 0.5; }
  function extrano() {
    mostrar('sorpresa', !reducir); // se queda pasmada al chocar con la pared invisible
    setTimeout(function () { if (estado === 'bloqueada') tv.className = 'tvbob'; }, 400);
  }
  function barrera() {
    if (!caja || !zona) return;
    var h = caja.offsetHeight;
    var yB = zona.getBoundingClientRect().top; // la pared, en coordenadas de la ventana
    var desp = Math.min(0, yB - h - arr());    // cuánto la empuja la pared hacia arriba
    caja.style.transform = desp < 0 ? 'translateY(' + desp + 'px)' : '';
    var toca = tocaBarrera(yB);
    if (estado === 'libre' && toca) { estado = 'bloqueada'; clearTimeout(temporizador); extrano(); }
    else if (estado === 'bloqueada' && !toca) { estado = 'libre'; programar(900, true); }
    if (yB < 0) { // el usuario siguió bajando: la TV queda atrás, fuera de la ventana, y se duerme
      if (estado === 'libre' || estado === 'bloqueada') { estado = 'dormida'; clearTimeout(temporizador); mostrar('dormida', false); }
      if (tDespertar) { clearTimeout(tDespertar); tDespertar = null; }
    } else if (estado === 'dormida' && !tDespertar && yB > h * 0.6) { // volvió a subir y la ve dormida
      tDespertar = setTimeout(despertar, 2400);
    }
  }
  function despertar() {
    tDespertar = null;
    estado = 'despertando';
    mostrar('estatica', false);
    setTimeout(function () {
      mostrar('sorpresa', false);
      setTimeout(function () {
        mostrar('picara', false);
        setTimeout(function () {
          estado = tocaBarrera(zona.getBoundingClientRect().top) ? 'bloqueada' : 'libre';
          if (estado === 'libre') programar(2500, true);
          barrera();
        }, 1300);
      }, 800);
    }, 140);
  }
  barrera();

  // ---------- Terminal: la salida se escribe línea por línea al llegar a ella ----------
  function armar(el, max, ms) {
    if (!el) return;
    function mostrarPaso(k) {
      var lineas = el.querySelectorAll('[data-paso]');
      for (var i = 0; i < lineas.length; i++) {
        if (Number(lineas[i].getAttribute('data-paso')) <= k) lineas[i].hidden = false;
      }
    }
    function imprimir(k) {
      mostrarPaso(k);
      if (k < max) setTimeout(function () { imprimir(k + 1); }, ms);
    }
    if (reducir || !('IntersectionObserver' in window)) { mostrarPaso(max); return; }
    var io = new IntersectionObserver(function (entradas) {
      if (entradas.some(function (e) { return e.isIntersecting; })) { io.disconnect(); imprimir(1); }
    }, { threshold: 0.3 });
    io.observe(el);
  }
  armar(document.getElementById('salida-cmd'), 6, 900); // una línea cada 0.9 s al llegar a la terminal
  // ---------- Terminal de abajo: escribir 'terminal' abre la subpágina ----------
  (function () {
    var form = document.getElementById('cmd-form');
    var entrada = document.getElementById('cmd-in');
    var extra = document.getElementById('cmd-extra');
    if (!form || !entrada || !extra) return;
    function linea(t) { var d = document.createElement('div'); d.textContent = t; extra.appendChild(d); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = entrada.value.trim();
      entrada.value = '';
      if (!v) return;
      var k = v.toLowerCase().replace(/\.exe$/, '');
      linea('C:\\LYO\\sujeto_048>' + v);
      if (k === 'terminal') {
        linea('Abriendo línea remota...');
        setTimeout(function () { location.href = 'terminal/'; }, 600);
      } else if (k === 'ayuda' || k === 'help') {
        ['estado.exe', 'recuerdos.exe', 'escaner.exe', 'voz.exe', 'texto.exe'].forEach(linea);
      } else if (k === 'cls' || k === 'clear') {
        extra.textContent = '';
      } else {
        linea('"' + v + '" no se reconoce como un comando interno o externo,');
        linea('programa o archivo por lotes ejecutable.');
      }
    });
  })();

  // ---------- Comentarios: se guardan en este navegador y alguien contesta ----------
  (function () {
    var caja = document.getElementById('comentario');
    var boton = document.getElementById('publicar');
    var lista = document.getElementById('lista-comentarios');
    var vacio = document.getElementById('sin-comentarios');
    if (!caja || !boton || !lista) return;
    var CLAVE = 'lyo_comentarios';
    var VOZ = '???';
    var MOD = 'Halcyon · Moderación';
    var guardados = [];
    try { guardados = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { guardados = []; }

    // Respuestas según lo que se escriba. Se revisan en orden; la primera que coincide gana.
    var REGLAS = [
      { p: /halcyon/, mod: true, r: ['Este comentario infringe las normas de la comunidad y ha sido retirado. Gracias por su comprensión.'] },
      { p: /terminal|\bcmd\b|consol/, r: ['Abajo. Mucho más abajo. La terminal te abre si la llamas por su nombre.', 'Aquí no puedo hablar. Allá abajo hay una terminal.'] },
      { p: /\b048\b|sujeto/, r: ['¿Cómo sabes ese número?', 'No vuelvas a escribir ese número aquí. Lo leen.'] },
      { p: /bata|doctor|m[eé]dic|cl[ií]nica|enfermer/, r: ['No les digas que preguntaste por ellos.', 'Sonríen mucho, ¿verdad? Siempre con una libreta.'] },
      { p: /\btv\b|tele|pantalla|chica|ni[ñn]a/, r: ['Ella te está mirando ahora mismo.', 'No la pierdas de vista. Si se apaga, se apaga todo.'] },
      { p: /ayuda|help|auxilio|socorro/, r: ['Nadie viene cuando lo pides aquí. Baja.', 'Ayúdame tú primero.'] },
      { p: /secreto|c[oó]digo|oculto|pista|easter/, r: ['Si algo no carga, no es un error.', 'Lo que buscas ya lo viste. No lo leíste.'] },
      { p: /miedo|creepy|raro|extra[ñn]o|terror|da cosa/, r: ['Lo raro es que sigas aquí.', 'Todavía no has visto nada.'] },
      { p: /\blyo\b/, r: ['Todavía no sabes lo que significa.', 'Dilo otra vez. Despacio.'] },
      { p: /qui[eé]n eres|qui[eé]n sos|who are you|eres real/, r: ['Alguien que se quedó aquí.', 'La copia que no salió.'] },
      { p: /hola|buenas|hello|\bhi\b|hey/, r: ['Hola. Hace mucho que nadie escribía aquí.', '...¿hola?'] },
      { p: /juego|game|descarg|demo|cu[aá]ndo sale|precio/, r: ['Aún no está listo. Nosotros tampoco.', 'Pronto. Cuando terminen de revisarte.'] },
      { p: /gracias|thanks/, r: ['No me agradezcas todavía.'] }
    ];
    var GENERICAS = ['Te leí.', 'Guardado. Todo se guarda.', '¿Quién te dijo que escribieras aquí?', 'No estás solo en esta página.', 'Sigue bajando.', 'Eso mismo escribió el último que estuvo aquí.'];

    function elegir(a) { return a[Math.floor(Math.random() * a.length)]; }
    function hora(ts) {
      var d = new Date(ts);
      return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
    function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(guardados.slice(-40))); } catch (e) {} }
    function pintar(c, despues) {
      var el = document.createElement('article');
      el.className = 'comentario' + (c.tipo === 'voz' ? ' respuesta' : c.tipo === 'mod' ? ' moderacion' : '');
      var cab = document.createElement('div'); cab.className = 'com-cab';
      var a = document.createElement('span'); a.className = 'com-autor'; a.textContent = c.autor;
      var f = document.createElement('span'); f.className = 'com-fecha'; f.textContent = hora(c.ts);
      cab.appendChild(a); cab.appendChild(f);
      var p = document.createElement('p'); p.className = 'com-txt' + (c.retirado ? ' retirado' : ''); p.textContent = c.retirado ? '[comentario retirado]' : c.txt;
      el.appendChild(cab); el.appendChild(p);
      if (despues && despues.parentNode) despues.parentNode.insertBefore(el, despues.nextSibling); else lista.appendChild(el);
      if (vacio) vacio.hidden = true;
      return { el: el, p: p };
    }
    guardados.forEach(pintar);

    function responder(texto, nodo, c) {
      var k = texto.toLowerCase();
      var regla = null;
      for (var i = 0; i < REGLAS.length; i++) if (REGLAS[i].p.test(k)) { regla = REGLAS[i]; break; }
      var propios = guardados.filter(function (x) { return x.tipo === 'tu'; }).length;
      var txt = regla ? elegir(regla.r) : (propios >= 4 && Math.random() < 0.5 ? 'Demasiadas preguntas. Te están leyendo.' : elegir(GENERICAS));
      var mod = !!(regla && regla.mod);
      var aviso = document.createElement('div');
      aviso.className = 'escribiendo';
      aviso.textContent = (mod ? MOD : VOZ) + ' está escribiendo...';
      setTimeout(function () { lista.insertBefore(aviso, nodo.el.nextSibling); }, 900);
      setTimeout(function () {
        aviso.remove();
        if (mod) { c.retirado = true; nodo.p.textContent = '[comentario retirado]'; nodo.p.className = 'com-txt retirado'; }
        var r = { tipo: mod ? 'mod' : 'voz', autor: mod ? MOD : VOZ, txt: txt, ts: Date.now() };
        guardados.splice(guardados.indexOf(c) + 1, 0, r); guardar(); pintar(r, nodo.el);
      }, 2400 + Math.random() * 1800 + txt.length * 25);
    }

    function publicar() {
      var t = caja.value.trim().slice(0, 600);
      if (!t) { caja.focus(); return; }
      caja.value = '';
      var c = { tipo: 'tu', autor: 'Visitante', txt: t, ts: Date.now() };
      guardados.push(c); guardar();
      responder(t, pintar(c), c);
    }
    boton.addEventListener('click', publicar);
    caja.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); publicar(); }
    });
  })();
})();
