import React from 'react';
import './skeleton.css';

/**
 * Standard format dimension helper
 */
const formatDimension = (val) => {
  if (val === undefined || val === null) return undefined;
  return typeof val === 'number' ? `${val}px` : val;
};

/**
 * Thinkwires Custom Skeleton Loading Primitive
 *
 * @param {Object} props
 * @param {'text'|'circular'|'rounded'|'rectangular'} [props.variant='text'] - Shape variant
 * @param {'wave'|'pulse'|'none'} [props.animation='wave'] - Animation type
 * @param {string|number} [props.width] - Element width (e.g. 120, '80%', '10rem')
 * @param {string|number} [props.height] - Element height (e.g. 24, '2rem')
 * @param {string} [props.className] - Additional CSS class names
 * @param {Object} [props.style] - Inline style overrides
 * @param {number} [props.count=1] - Number of identical skeleton elements to render
 * @param {string} [props.as] - HTML tag to render (defaults to 'span' for text, 'div' otherwise)
 * @param {string} [props.ariaLabel='Loading...'] - Accessible label for screen readers
 */
export const Skeleton = ({
  variant = 'text',
  animation = 'wave',
  width,
  height,
  className = '',
  style = {},
  count = 1,
  as,
  ariaLabel = 'Loading...',
  ...rest
}) => {
  const Component = as || (variant === 'text' ? 'span' : 'div');

  const classes = [
    'tw-skeleton',
    `tw-skeleton-${variant}`,
    `tw-skeleton-${animation}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inlineStyles = {
    ...style,
    width: formatDimension(width) || style.width,
    height: formatDimension(height) || style.height,
  };

  const renderSingle = (key) => (
    <Component
      key={key}
      className={classes}
      style={inlineStyles}
      role="status"
      aria-busy="true"
      {...rest}
    >
      <span className="tw-skeleton-sr-only">{ariaLabel}</span>
    </Component>
  );

  if (count <= 1) {
    return renderSingle(0);
  }

  return (
    <>
      {Array.from({ length: count }, (_, i) => renderSingle(i))}
    </>
  );
};

export default Skeleton;

