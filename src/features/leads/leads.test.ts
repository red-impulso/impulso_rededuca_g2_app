import { describe, expect, it } from 'vitest';
import { enlaceWhatsApp, fechaPostulacion } from './leads';

describe('enlaceWhatsApp', () => {
  it.each([
    ['388 400-0000', 'https://wa.me/5493884000000'],
    ['(0388) 400-0000', 'https://wa.me/5493884000000'],
    ['+54 388 400 0000', 'https://wa.me/5493884000000'],
    ['+54 9 388 400 0000', 'https://wa.me/5493884000000'],
    ['5493884000000', 'https://wa.me/5493884000000'],
  ])('%s -> %s', (telefono, enlace) => {
    expect(enlaceWhatsApp(telefono)).toBe(enlace);
  });
});

describe('fechaPostulacion', () => {
  it('muestra el día en la hora de Argentina', () => {
    // 02:00 en UTC todavía es el día anterior en Argentina (UTC-3).
    expect(fechaPostulacion('2026-11-07T02:00:00Z')).toBe('06/11/2026');
  });
});
