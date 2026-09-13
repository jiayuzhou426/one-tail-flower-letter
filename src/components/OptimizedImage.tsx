import type { ComponentPropsWithoutRef } from 'react';

type OptimizedImageProps = Omit<ComponentPropsWithoutRef<'img'>, 'src'> & {
  /** Modern, compact WebP source. */
  src: string;
  /** Original PNG used automatically by browsers without WebP support. */
  fallbackSrc: string;
};

/**
 * Keep the DOM node as a normal img so every existing positioning selector
 * continues to apply. Modern browsers use WebP; unsupported engines retry
 * once with the original PNG.
 */
export function OptimizedImage({ src, fallbackSrc, onError, ...props }: OptimizedImageProps) {
  return <img
    // Remount if a flower switches state: a browser that does not support WebP
    // must be able to retry the matching PNG fallback for each new source.
    key={src}
    {...props}
    src={src}
    onError={event => {
      onError?.(event);
      if (event.currentTarget.dataset.fallbackApplied) return;
      event.currentTarget.dataset.fallbackApplied = 'true';
      event.currentTarget.src = fallbackSrc;
    }}
  />;
}
