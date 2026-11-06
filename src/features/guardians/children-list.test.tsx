// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { ChildrenList } from './children-list';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

describe('ChildrenList', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('muestra cada hijo con su curso y enlaza a sus notas', async () => {
    mockApi.mockResolvedValueOnce([
      { id: 'a1', firstName: 'Ana', lastName: 'Pérez', course: { id: 'c1', year: 1, division: 'A' } },
      { id: 'a2', firstName: 'Beto', lastName: 'Ruiz', course: { id: 'c2', year: 2, division: 'B' } },
    ]);

    render(<ChildrenList institutionId="esc-1" />);

    const ana = await screen.findByRole('link', { name: /Ana Pérez/ });
    expect(ana.getAttribute('href')).toBe('/hijos/a1/notas');
    expect(ana.textContent).toContain('1°A');
    expect(screen.getByRole('link', { name: /Beto Ruiz/ }).getAttribute('href')).toBe('/hijos/a2/notas');
    expect(mockApi).toHaveBeenCalledWith('/me/students', { institutionId: 'esc-1' });
  });

  it('avisa si no tiene hijos vinculados', async () => {
    mockApi.mockResolvedValueOnce([]);

    render(<ChildrenList institutionId="esc-1" />);

    expect(await screen.findByText('Todavía no tenés hijos vinculados.')).toBeTruthy();
  });

  it('muestra el error de la API', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(403, 'Forbidden resource'));

    render(<ChildrenList institutionId="esc-1" />);

    expect((await screen.findByRole('alert')).textContent).toBe('Forbidden resource');
  });
});
