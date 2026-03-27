import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewMode } from '@/hooks/useViewMode';

describe('useViewMode', () => {
  it('defaults to "participante" mode', () => {
    const { result } = renderHook(() => useViewMode());
    expect(result.current.viewMode).toBe('participante');
  });

  it('accepts a custom default mode', () => {
    const { result } = renderHook(() => useViewMode('admin'));
    expect(result.current.viewMode).toBe('admin');
  });

  it('starts with previewSponsorId as null', () => {
    const { result } = renderHook(() => useViewMode());
    expect(result.current.previewSponsorId).toBeNull();
  });

  it('switchTo changes the viewMode', () => {
    const { result } = renderHook(() => useViewMode());

    act(() => {
      result.current.switchTo('admin');
    });

    expect(result.current.viewMode).toBe('admin');
  });

  it('switchTo "patrocinador" with sponsorId sets previewSponsorId', () => {
    const { result } = renderHook(() => useViewMode());

    act(() => {
      result.current.switchTo('patrocinador', 'sponsor-123');
    });

    expect(result.current.viewMode).toBe('patrocinador');
    expect(result.current.previewSponsorId).toBe('sponsor-123');
  });

  it('switchTo "patrocinador" without sponsorId clears previewSponsorId', () => {
    const { result } = renderHook(() => useViewMode());

    // First set a sponsor
    act(() => {
      result.current.switchTo('patrocinador', 'sponsor-123');
    });
    expect(result.current.previewSponsorId).toBe('sponsor-123');

    // Now switch to patrocinador without sponsorId
    act(() => {
      result.current.switchTo('patrocinador');
    });
    expect(result.current.viewMode).toBe('patrocinador');
    expect(result.current.previewSponsorId).toBeNull();
  });

  it('switchTo "admin" clears previewSponsorId', () => {
    const { result } = renderHook(() => useViewMode());

    // First set a sponsor
    act(() => {
      result.current.switchTo('patrocinador', 'sponsor-456');
    });
    expect(result.current.previewSponsorId).toBe('sponsor-456');

    // Switch to admin
    act(() => {
      result.current.switchTo('admin');
    });

    expect(result.current.viewMode).toBe('admin');
    expect(result.current.previewSponsorId).toBeNull();
  });

  it('switchTo "participante" clears previewSponsorId', () => {
    const { result } = renderHook(() => useViewMode());

    // Set a sponsor first
    act(() => {
      result.current.switchTo('patrocinador', 'sponsor-789');
    });
    expect(result.current.previewSponsorId).toBe('sponsor-789');

    // Switch back to participante
    act(() => {
      result.current.switchTo('participante');
    });

    expect(result.current.viewMode).toBe('participante');
    expect(result.current.previewSponsorId).toBeNull();
  });

  it('switchTo returns stable function reference', () => {
    const { result, rerender } = renderHook(() => useViewMode());
    const firstRef = result.current.switchTo;

    rerender();

    expect(result.current.switchTo).toBe(firstRef);
  });
});
