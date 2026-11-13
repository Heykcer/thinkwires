import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import LiquidAuroraRibbons from '../../components/HomeComponents/LiquidAuroraRibbons';

describe('LiquidAuroraRibbons (Unit Test)', () => {
  it('renders liquid aurora and 3D glass ribbons container with proper accessibility traits', () => {
    const { container } = render(<LiquidAuroraRibbons />);

    const root = container.querySelector('.tw-liquid-aurora-root');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-hidden', 'true');

    // Verify presence of Liquid Aurora mesh layers
    expect(
      container.querySelector('.tw-aurora-mesh-container')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.tw-aurora-blob-primary')
    ).toBeInTheDocument();
    expect(container.querySelector('.tw-aurora-blob-cyan')).toBeInTheDocument();
    expect(
      container.querySelector('.tw-aurora-blob-green')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.tw-aurora-blob-lavender')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.tw-aurora-blob-center')
    ).toBeInTheDocument();

    // Verify presence of 3D Glass Ribbons SVG and groups
    const svg = container.querySelector('svg.tw-glass-ribbon-svg');
    expect(svg).toBeInTheDocument();
    expect(
      container.querySelector('.tw-glass-group-primary')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.tw-glass-group-secondary')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.tw-glass-group-left')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.tw-glass-group-bridge')
    ).toBeInTheDocument();

    // Verify full-width specular light sweeps
    expect(container.querySelector('.tw-glass-light-sweep')).toBeInTheDocument();
    expect(container.querySelector('.tw-glass-light-sweep-left')).toBeInTheDocument();

    // Verify caustic optical glow flares
    expect(container.querySelector('.tw-glass-caustic-1')).toBeInTheDocument();
    expect(container.querySelector('.tw-glass-caustic-2')).toBeInTheDocument();
    expect(container.querySelector('.tw-glass-caustic-3')).toBeInTheDocument();
    expect(container.querySelector('.tw-glass-caustic-4')).toBeInTheDocument();
  });

  it('contains absolutely no particle, dot or network canvas elements', () => {
    const { container } = render(<LiquidAuroraRibbons />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('.ParticleNetwork-canvas')).toBeNull();
  });
});

