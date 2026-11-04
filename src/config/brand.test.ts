import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRAND_COLORS } from './brand';

const css = readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8');

describe('BRAND_COLORS', () => {
  for (const [nombre, valor] of Object.entries(BRAND_COLORS)) {
    it(`--color-${nombre} en globals.css vale ${valor}`, () => {
      const match = css.match(new RegExp(`--color-${nombre}:\\s*(#[0-9a-fA-F]{6})`));
      expect(match?.[1].toLowerCase()).toBe(valor);
    });
  }
});
