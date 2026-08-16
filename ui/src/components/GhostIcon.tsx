import React from 'react';

/**
 * The Kiro bespectacled ghost — from assets/kiro-icon/mark.svg.
 * Renders inline at the specified size (default 24px).
 */
export function GhostIcon({ size = 24 }: { size?: number }): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      role="img"
      aria-label="Kiro ghost"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <g transform="translate(16.0 11.6) scale(13.5194 13.9519)">
        <path
          d="M8.748 1c2.242-.002 4.504 1.351 5.34 3.981l.076.26.1.418c.266 1.263.663 4.441-1.074 7.59l-.001.001c-.506.914-1.444 1.81-2.428 2.209-.498.201-1.134.325-1.764.1a1.959 1.959 0 0 1-.675-.412c-1.03.534-2.183.694-3.132.295a2.313 2.313 0 0 1-1.382-1.612 2.8 2.8 0 0 1-.072-.746c-.534-.049-1.01-.273-1.344-.756a1.965 1.965 0 0 1-.328-1.188c.012-.363.112-.723.273-1.029l.003-.005.285-.537c.067-.13.113-.229.153-.335.153-.424.196-.662.262-1.12l.001-.003.045-.34c.04-.337.067-.665.11-1.044.05-.456.122-.951.268-1.439C4.131 2.458 6.43 1.003 8.748 1Z"
          fill="currentColor"
        />
        <path
          d="M8.862 7.528c-.523 0-.603-.626-.603-.998 0-.337.06-.602.175-.773.1-.15.246-.226.428-.226.183 0 .342.076.453.23.127.175.194.44.194.769 0 .626-.242.998-.643.998h-.004ZM11.017 7.528c-.524 0-.603-.626-.603-.998 0-.337.06-.602.174-.773.1-.15.246-.226.429-.226.182 0 .34.076.452.23.127.175.194.44.194.769 0 .626-.242.998-.642.998h-.004Z"
          fill="var(--ghost-eyes, #140f24)"
        />
        <g
          fill="none"
          stroke="var(--ghost-glasses, #fcc419)"
          strokeWidth="0.42"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse cx="8.862" cy="6.53" rx="1.03" ry="1.68" />
          <ellipse cx="11.017" cy="6.53" rx="1.03" ry="1.68" />
          <path d="M9.9 5.8Q9.9 5.0 10.0 5.8" />
          <path d="M12.0 6.0Q13.0 5.4 13.7 6.4" />
          <path d="M7.8 6.0Q6.0 5.3 4.5 6.3" />
        </g>
        <ellipse cx="8.862" cy="6.53" rx="0.8" ry="1.5" fill="var(--ghost-glasses, #fcc419)" opacity=".14" />
        <ellipse cx="11.017" cy="6.53" rx="0.8" ry="1.5" fill="var(--ghost-glasses, #fcc419)" opacity=".14" />
      </g>
    </svg>
  );
}
