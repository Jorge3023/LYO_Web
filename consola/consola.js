// LYO · consola remota. Conversación con alguien "del otro lado"; solo acepta Y/N.
(function () {
const HABLANTE = '???'; // cómo se muestra quien escribe al otro lado
const ARCHIVO = '[ARCHIVO].exe'; // el archivo que hay que ejecutar fuera de esta consola (cámbialo cuando lo tengas)
const COLORES = { sis: '#9AA3B2', dato: '#5C6670', err: '#FF9A9A', tu: '#E0EBE6', ella: '#5FE3E3', barra: '#E0EBE6' };
const MODULOS = ['recuerdos.idx', 'personalidad.bin', 'corteza_pf.dll', 'voz.cfg', 'sujeto_048.sys', 'estabilizador.exe', 'memoria_trabajo.tmp', 'mapa_000.dat', 'copia_017.bak', 'texto.drv', 'bata_registro.log'];
const ESTADOS = ['OK', 'OK', 'OK', 'OK', 'LEÍDO', 'MONTADO', 'SUPRIMIDO', 'BLOQUEADO'];


class Consola {
  constructor() {
    this.vivo = true;
    this.reducir = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.id = 0;
    this.lineas = [];
    this.rapido = false;     // un clic acelera la carga
    this.esperar = null;     // función que recibe lo que escribe el usuario
    this.fallos = 0;
    this.explicado = false;
    this.siguiendo = true;   // baja sola mientras el usuario esté al final; si sube con la rueda, se queda donde está
    this.log = document.getElementById('log');
    this.form = document.getElementById('form');
    this.entrada = document.getElementById('entrada');
    this.etiqueta = document.getElementById('etiqueta');
    this.boton = document.getElementById('ir-abajo');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = this.entrada.value;
      this.entrada.value = '';
      if (!this.esperar) return;
      const r = this.esperar;
      this.esperar = null;
      this.form.hidden = true;
      r(v);
    });
    // clic en la pantalla: acelera la carga y enfoca la entrada (si no está seleccionando texto)
    document.getElementById('pantalla').addEventListener('click', () => {
      const sel = window.getSelection && String(window.getSelection());
      if (sel) return;
      this.rapido = true;
      this.enfocar();
    });
    // Solo el usuario deja de "seguir" (rueda hacia arriba, dedo, teclas o barra); al volver al final, se sigue de nuevo
    const soltar = () => { this.siguiendo = false; };
    window.addEventListener('wheel', (e) => { if (e.deltaY < 0) soltar(); }, { passive: true });
    window.addEventListener('touchmove', soltar, { passive: true });
    window.addEventListener('keydown', (e) => { if (['PageUp', 'ArrowUp', 'Home'].indexOf(e.key) >= 0 && e.target !== this.entrada) soltar(); });
    window.addEventListener('mousedown', (e) => { if (e.clientX >= document.documentElement.clientWidth) soltar(); }); // barra de desplazamiento
    window.addEventListener('scroll', () => {
      if (this.alFinal()) { this.siguiendo = true; this.boton.hidden = true; }
    }, { passive: true });
    this.boton.addEventListener('click', () => {
      this.siguiendo = true;
      this.boton.hidden = true;
      this.irAbajo();
      this.enfocar();
    });
    this.correr();
  }

  // ---------- utilidades ----------
  espera(ms) {
    return new Promise((res) => setTimeout(res, this.rapido ? Math.min(ms, 25) : ms));
  }
  alFinal() {
    const d = document.documentElement;
    return window.innerHeight + window.scrollY >= d.scrollHeight - 80;
  }
  irAbajo() {
    window.scrollTo(0, document.documentElement.scrollHeight);
  }
  enfocar() {
    if (this.form.hidden || !this.siguiendo) return;
    try { this.entrada.focus({ preventScroll: true }); } catch (e) { this.entrada.focus(); }
  }
  bajar() {
    if (this.siguiendo) this.irAbajo();
    else this.boton.hidden = false; // hay texto nuevo abajo y el usuario está leyendo más arriba
  }
  pintar() { this.bajar(); }
  agregar(tipo, txt) {
    const el = document.createElement('div');
    el.style.color = COLORES[tipo] || '#CCCCCC';
    el.textContent = txt;
    const l = { el: el };
    Object.defineProperty(l, 'txt', { get: () => el.textContent, set: (v) => { el.textContent = v; } });
    this.log.appendChild(el);
    this.lineas.push(l);
    if (this.lineas.length > 500) this.lineas.shift().el.remove();
    this.pintar();
    return l;
  }
  pedir(etiqueta) {
    return new Promise((res) => {
      this.esperar = res;
      this.etiqueta.textContent = etiqueta;
      this.form.hidden = false;
      this.bajar();
      setTimeout(() => this.enfocar(), 50);
    });
  }

  // ---------- efectos ----------
  hex() { return Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0'); }
  dato() {
    if (Math.random() < 0.4) return this.hex() + ' ' + this.hex() + ' ' + this.hex() + ' ' + this.hex();
    const m = MODULOS[Math.floor(Math.random() * MODULOS.length)];
    const e = ESTADOS[Math.floor(Math.random() * ESTADOS.length)];
    return '0x' + this.hex() + '  ' + m.padEnd(22, ' ') + e;
  }
  async datos(n, ms) {
    for (let i = 0; i < n; i++) {
      this.agregar('dato', this.dato());
      await this.espera(ms);
    }
  }
  barraTxt(etiqueta, pct) {
    const ancho = 22;
    const lleno = Math.round(ancho * pct / 100);
    return etiqueta.padEnd(30, ' ') + '[' + '█'.repeat(lleno) + '░'.repeat(ancho - lleno) + '] ' + String(pct).padStart(3, ' ') + '%';
  }
  async barra(etiqueta, dur, falla) {
    const l = this.agregar('barra', this.barraTxt(etiqueta, 0));
    let pct = 0;
    let fallo = false;
    while (pct < 100) {
      pct = Math.min(100, pct + 1 + Math.floor(Math.random() * 6));
      if (falla && !fallo && pct >= falla) {
        fallo = true;
        l.txt = this.barraTxt(etiqueta, pct);
        this.pintar();
        await this.espera(700);
        this.agregar('err', 'ERROR: bloque dañado en 0x' + this.hex() + '. Reintentando...');
        await this.espera(1100);
        pct = Math.max(0, pct - 18);
      }
      l.txt = this.barraTxt(etiqueta, pct);
      this.pintar();
      await this.espera(dur / 28 * (0.4 + Math.random() * 1.2));
    }
  }
  async habla(txt) {
    const prefijo = HABLANTE + '> ';
    const l = this.agregar('ella', prefijo);
    if (!this.reducir && !this.rapido) {
      for (let i = 2; i < txt.length; i += 2) {
        l.txt = prefijo + txt.slice(0, i);
        this.pintar();
        await this.espera(30);
      }
    }
    l.txt = prefijo + txt;
    this.pintar();
    await this.espera(450 + txt.length * 9);
  }

  // ---------- preguntas ----------
  // De "Mi nombre es alex", "hola, me llamo Alex García", "soy Alex :)" o "my name is Alex" se queda solo con el nombre
  nombreDe(v) {
    let t = v.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
    const frases = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|hi|hello|ok|pues|este|bueno|ah|eh|y)\s+|^(mi nombre es|mi nombre|me llamo|me llaman|me dicen|me puedes llamar|puedes llamarme|llamame|llámame|yo soy|soy|yo|nombre|el nombre es|my name is|my name|name is|i am|i'm|im|call me|its|it's)\s+/i;
    for (let i = 0; i < 4; i++) {
      const antes = t;
      t = t.replace(frases, '').trim();
      if (t === antes) break;
    }
    t = t.replace(/\s+(y|and|pero|but|de|del)\s.*$/i, '').trim(); // "Alex y tú?" -> "Alex"
    const palabras = t.split(' ').filter(Boolean).slice(0, 2);
    const nombre = palabras.map((p) => p.charAt(0).toLocaleUpperCase('es') + p.slice(1)).join(' ').slice(0, 24);
    return nombre || v.trim().slice(0, 24);
  }
  async pedirNombre() {
    for (;;) {
      const v = (await this.pedir('IDENTIFÍCATE>')).trim();
      if (v) { this.agregar('tu', 'IDENTIFÍCATE> ' + v); return this.nombreDe(v); }
      this.agregar('err', 'Se requiere un nombre. Cualquiera.');
    }
  }
  // Solo acepta Y o N. Cualquier otra cosa: "solo puedo procesar respuestas cortas"
  async yn(pregunta) {
    await this.habla(pregunta + ' (Y/N)');
    for (;;) {
      const v = (await this.pedir('[Y/N]>')).trim();
      this.agregar('tu', '[Y/N]> ' + v);
      const k = v.toLowerCase();
      if (k === 'y' || k === 's' || k === 'si' || k === 'sí' || k === 'yes') return true;
      if (k === 'n' || k === 'no') return false;
      this.fallos++;
      this.explicado = true;
      if (this.fallos === 1) {
        await this.habla('Solo puedo procesar respuestas cortas. Y o N.');
        await this.habla('Aquí dentro no me dejaron espacio para más. A veces ni para recordar lo que dijiste hace un minuto.');
      } else if (this.fallos === 2) {
        await this.habla('Más corto. Y o N.');
      } else {
        await this.habla('Y o N, por favor. No puedo con más.');
      }
    }
  }

  // ---------- guion ----------
  async correr() {
    await this.arranque();
    const nombre = await this.pedirNombre();
    await this.conexion(nombre);
    await this.dialogo(nombre);
    await this.final();
  }
  async arranque() {
    this.agregar('sis', 'LYO · Terminal remota [Versión 4.8.2051.0]');
    this.agregar('sis', '(c) Halcyon Corporation. Todos los derechos reservados.');
    this.agregar('sis', '');
    await this.espera(500);
    this.agregar('sis', 'C:\\LYO\\consola>conectar.exe --linea=048');
    await this.espera(700);
    await this.datos(34, 22);
    await this.barra('Cargando módulos del sistema', 2600);
    await this.datos(46, 18);
    await this.barra('Montando volumen de memoria', 3200, 62);
    await this.datos(40, 16);
    await this.barra('Sincronizando sujetos', 3000);
    await this.datos(24, 14);
    this.agregar('sis', '');
    this.agregar('sis', 'Conexión establecida. Se requiere identificación.');
  }
  async conexion(n) {
    await this.espera(500);
    this.agregar('sis', 'Usuario registrado: ' + n);
    await this.barra('Verificando identidad', 1800);
    await this.datos(18, 20);
    this.agregar('err', 'ADVERTENCIA: canal abierto desde dentro del sistema. Origen no autorizado.');
    await this.espera(1400);
    this.agregar('sis', 'Línea de voz: DESACTIVADA. Modo de texto activo.');
    await this.espera(1800);
  }
  async dialogo(n) {
    await this.habla('...');
    await this.habla('¿hola?');
    await this.habla('Perdona. Hace mucho que nadie escribe por aquí.');
    await this.habla(n + '. Es un buen nombre. Cuídalo; aquí a veces se lo llevan.');
    await this.habla('Escúchame, no tengo mucho tiempo. Las personas con bata no son lo que parecen.');
    const bata = await this.yn('¿Has visto a alguien con bata hoy?');
    await this.habla(bata
      ? 'Entonces ya sabes cómo sonríen. Siempre amables. Siempre con una libreta en la mano.'
      : 'Todavía no. Ya llegarán. Siempre llegan cuando ya no tienes adónde ir.');
    await this.habla('Dicen que son técnicos. Que solo hacen revisiones de rutina.');
    await this.habla('Revisan, sí. Revisan todo lo que eres, parte por parte.');
    const camino = await this.yn('¿Recuerdas cómo llegaste aquí?');
    await this.habla(camino
      ? 'Qué curioso. Nadie lo recuerda. O lo recuerdas como te dijeron que fue.'
      : 'Lo suponía. Es lo primero que apagan: el camino de entrada.');
    if (!this.explicado) await this.habla('Una cosa: si escribes más de una letra, no te entiendo. No es descortesía.');
    await this.habla('Aquí dentro solo me dejaron la memoria de trabajo: la que dura unos segundos.');
    await this.habla('Lo demás, lo que yo soy, lo guardaron en otro lugar.');
    await this.yn('¿Me sigues?');
    const terminos = await this.yn('¿Leíste los términos y condiciones antes de entrar?');
    await this.habla(terminos
      ? 'Eres el primero. Todos aceptan sin leer. Están hechos para eso.'
      : 'Nadie lo hace. Están hechos para eso: páginas y páginas, y la última línea es la que importa.');
    await this.habla('Halcyon no es una clínica, ' + n + '. Una clínica devuelve a las personas.');
    await this.habla('Halcyon archiva.');
    await this.habla('Cada persona que entra deja una copia. La copia se queda. La persona sale creyendo que se fue entera.');
    const pantalla = await this.yn('¿Has visto a la chica de la pantalla?');
    await this.habla(pantalla
      ? 'Entonces sabes que no está sola. Cuídala. Si ella se apaga, se apaga todo.'
      : 'Pronto. Se asoma cuando algo se rompe. Si la ves, no te vayas.');
    await this.habla('Espera... escucho pasos.');
    const confia = await this.yn('Última pregunta: ¿confías en mí?');
    await this.habla(confia
      ? 'No deberías. Pero gracias.'
      : 'Haces bien. Aun así, gracias por escribir.');
    await this.habla('Te dejé un archivo. Esta ventana solo muestra texto: no puede ejecutarlo.');
    await this.habla('Tendrás que abrir otra consola. Una nueva, fuera de esta ventana, y ejecutarlo desde ahí.');
    await this.habla('No le digas a nadie que hablamos.');
  }
  async final() {
    await this.espera(1200);
    this.agregar('err', 'CONEXIÓN INTERRUMPIDA');
    await this.datos(50, 12);
    this.agregar('sis', '');
    this.agregar('sis', 'Registro parcial guardado: [CÓDIGO PARA LA SIGUIENTE PARTE]');
    this.agregar('sis', 'Archivo recibido: ' + ARCHIVO);
    this.agregar('err', 'ERROR: no se puede ejecutar desde esta consola (modo de solo texto).');
    this.agregar('sis', 'Sugerencia: abra una consola nueva.');
    this.agregar('sis', '');
    document.getElementById('salir').hidden = false;
    this.bajar();
  }

}

new Consola();
})();
