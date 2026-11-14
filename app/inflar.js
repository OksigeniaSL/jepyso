// Raw DEFLATE (RFC 1951) decoder, for phones without DecompressionStream (iOS before 16.4): a compressed routine link
// opens there too. Only loaded when the browser's own decoder is missing or fails. Written after zlib's «puff».
const LONGITUD_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LONGITUD_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DISTANCIA_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DISTANCIA_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const ORDEN_LONGITUDES = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

// A canonical Huffman table: how many codes of each length, and the symbols in code order.
function tabla(longitudes) {
  const cuenta = new Uint16Array(16);
  for (const l of longitudes) cuenta[l]++;
  cuenta[0] = 0;
  const desde = new Uint16Array(16);
  for (let l = 1; l < 16; l++) desde[l] = desde[l - 1] + cuenta[l - 1];
  const simbolos = new Uint16Array(longitudes.length);
  longitudes.forEach((l, s) => {
    if (l) simbolos[desde[l]++] = s;
  });
  return { cuenta, simbolos };
}

const FIJA_LITERALES = tabla(Array.from({ length: 288 }, (_, s) => (s < 144 ? 8 : s < 256 ? 9 : s < 280 ? 7 : 8)));
const FIJA_DISTANCIAS = tabla(Array(30).fill(5));

export function inflar(entrada, maximo = 1 << 20) {
  let p = 0;
  let reserva = 0;
  let enReserva = 0;
  let salida = new Uint8Array(Math.max(1024, entrada.length * 4));
  let o = 0;

  const bits = (k) => {
    while (enReserva < k) {
      if (p >= entrada.length) throw new Error('Datos cortados');
      reserva |= entrada[p++] << enReserva;
      enReserva += 8;
    }
    const v = reserva & ((1 << k) - 1);
    reserva >>>= k;
    enReserva -= k;
    return v;
  };
  const poner = (b) => {
    if (o >= salida.length) {
      if (salida.length >= maximo) throw new Error('Demasiado grande');
      const mayor = new Uint8Array(Math.min(maximo, salida.length * 2));
      mayor.set(salida);
      salida = mayor;
    }
    salida[o++] = b;
  };
  const leer = ({ cuenta, simbolos }) => {
    let codigo = 0;
    let primero = 0;
    let indice = 0;
    for (let l = 1; l < 16; l++) {
      codigo |= bits(1);
      const c = cuenta[l];
      if (codigo - c < primero) return simbolos[indice + (codigo - primero)];
      indice += c;
      primero = (primero + c) << 1;
      codigo <<= 1;
    }
    throw new Error('Código no válido');
  };

  let ultimo = 0;
  do {
    ultimo = bits(1);
    const tipo = bits(2);
    if (tipo === 0) {
      // Stored block: the rest of the current byte is skipped.
      reserva = 0;
      enReserva = 0;
      if (p + 4 > entrada.length) throw new Error('Datos cortados');
      const largo = entrada[p] | (entrada[p + 1] << 8);
      p += 4;
      if (p + largo > entrada.length) throw new Error('Datos cortados');
      for (let i = 0; i < largo; i++) poner(entrada[p++]);
      continue;
    }
    let literales = FIJA_LITERALES;
    let distancias = FIJA_DISTANCIAS;
    if (tipo === 2) {
      const nLiterales = bits(5) + 257;
      const nDistancias = bits(5) + 1;
      const nLongitudes = bits(4) + 4;
      const deLongitudes = Array(19).fill(0);
      for (let i = 0; i < nLongitudes; i++) deLongitudes[ORDEN_LONGITUDES[i]] = bits(3);
      const tablaLongitudes = tabla(deLongitudes);
      const longitudes = [];
      while (longitudes.length < nLiterales + nDistancias) {
        const s = leer(tablaLongitudes);
        if (s < 16) {
          longitudes.push(s);
          continue;
        }
        let valor = 0;
        let veces;
        if (s === 16) {
          if (!longitudes.length) throw new Error('Repetición sin valor');
          valor = longitudes[longitudes.length - 1];
          veces = 3 + bits(2);
        } else if (s === 17) veces = 3 + bits(3);
        else veces = 11 + bits(7);
        for (let i = 0; i < veces; i++) longitudes.push(valor);
      }
      literales = tabla(longitudes.slice(0, nLiterales));
      distancias = tabla(longitudes.slice(nLiterales, nLiterales + nDistancias));
    } else if (tipo !== 1) {
      throw new Error('Bloque no válido');
    }
    for (;;) {
      const s = leer(literales);
      if (s < 256) poner(s);
      else if (s === 256) break;
      else {
        const i = s - 257;
        if (i >= LONGITUD_BASE.length) throw new Error('Longitud no válida');
        const largo = LONGITUD_BASE[i] + bits(LONGITUD_EXTRA[i]);
        const d = leer(distancias);
        if (d >= DISTANCIA_BASE.length) throw new Error('Distancia no válida');
        const distancia = DISTANCIA_BASE[d] + bits(DISTANCIA_EXTRA[d]);
        if (distancia > o) throw new Error('Distancia demasiado lejos');
        for (let k = 0; k < largo; k++) poner(salida[o - distancia]);
      }
    }
  } while (!ultimo);
  return salida.subarray(0, o);
}
