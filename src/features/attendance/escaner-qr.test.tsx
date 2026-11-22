// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EscanerQr } from './escaner-qr';

function conCamara(getUserMedia: () => Promise<unknown>) {
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
}

describe('EscanerQr', () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
  });

  it('pide la cámara de atrás del celular', async () => {
    const getUserMedia = vi.fn(() => new Promise(() => {}));
    conCamara(getUserMedia);
    render(<EscanerQr onCodigo={vi.fn()} onCerrar={vi.fn()} />);

    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'environment' }, audio: false });
    expect(screen.getByRole('dialog', { name: 'Escanear carnets' })).toBeTruthy();
    expect(screen.getByText('Prendiendo la cámara...')).toBeTruthy();
  });

  it('sin permiso para la cámara lo explica', async () => {
    conCamara(() => Promise.reject(Object.assign(new Error('no'), { name: 'NotAllowedError' })));
    render(<EscanerQr onCodigo={vi.fn()} onCerrar={vi.fn()} />);

    expect((await screen.findByRole('alert')).textContent).toContain('No diste permiso para usar la cámara');
  });

  it('sin cámara lo dice', async () => {
    render(<EscanerQr onCodigo={vi.fn()} onCerrar={vi.fn()} />);

    expect((await screen.findByRole('alert')).textContent).toContain('No encontramos una cámara');
  });

  it('Listo cierra y apaga la cámara', async () => {
    const stop = vi.fn();
    conCamara(() => Promise.resolve({ getTracks: () => [{ stop }] }));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const onCerrar = vi.fn();
    render(<EscanerQr onCodigo={vi.fn()} onCerrar={onCerrar} />);

    await screen.findByText('Apuntá la cámara al QR del carnet.');
    await userEvent.click(screen.getByRole('button', { name: 'Listo' }));

    expect(onCerrar).toHaveBeenCalled();
    cleanup();
    expect(stop).toHaveBeenCalled();
  });
});
