import { describe, expect, it } from 'vitest';
import Home from './page';

describe('página raíz', () => {
  it('manda a /inicio (sin sesión, el proxy ya manda antes a /ingresar)', () => {
    let digest = '';
    try {
      Home();
    } catch (error) {
      digest = (error as { digest?: string }).digest ?? '';
    }
    expect(digest).toContain('NEXT_REDIRECT');
    expect(digest).toContain('/inicio');
  });
});
