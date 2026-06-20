export function numeroALetras(num: number): string {
  const unidades = [
    '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS',
    'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
  ];
  const decenas = [
    '', '', 'VEINTI', 'TREINTA', 'CUARENTA', 'CINCUENTA',
    'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
  ];
  const centenas = [
    '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
    'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
  ];

  if (num === 0) return 'CERO';

  const entero = Math.floor(num);
  const decimales = Math.round((num - entero) * 100);
  let letras = '';

  if (entero >= 1000000) {
    const millones = Math.floor(entero / 1000000);
    if (millones === 1) {
      letras += 'UN MILLÓN ';
    } else {
      letras += numeroALetras(millones) + ' MILLONES ';
    }
  }

  const restoMillones = entero % 1000000;
  if (restoMillones >= 1000) {
    const miles = Math.floor(restoMillones / 1000);
    if (miles === 1) {
      letras += 'MIL ';
    } else {
      letras += numeroALetras(miles) + ' MIL ';
    }
  }

  const resto = restoMillones % 1000;
  if (resto > 0) {
    if (resto >= 100) {
      const c = Math.floor(resto / 100);
      if (resto === 100) {
        letras += 'CIEN ';
      } else {
        letras += centenas[c] + ' ';
      }
    }
    const restoDec = resto % 100;
    if (restoDec > 0) {
      if (restoDec <= 20) {
        letras += unidades[restoDec] + ' ';
      } else {
        const d = Math.floor(restoDec / 10);
        const u = restoDec % 10;
        if (d === 2) {
          letras += 'VEINTI' + (u > 0 ? unidades[u].toLowerCase() : '') + ' ';
        } else {
          letras += decenas[d];
          if (u > 0) {
            letras += ' Y ' + unidades[u];
          }
          letras += ' ';
        }
      }
    }
  }

  letras = letras.trim();

  if (decimales > 0) {
    const centavos = numeroALetras(decimales);
    letras += ' CON ' + centavos + ' CENTAVOS';
  }

  return letras;
}
