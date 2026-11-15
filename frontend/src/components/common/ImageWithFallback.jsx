import React, { useEffect, useState } from 'react';

const FALLBACK_IMAGE = '/product-placeholder.svg';

export default function ImageWithFallback({ src, alt, ...props }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <img
      {...props}
      src={!src || hasError ? FALLBACK_IMAGE : src}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}
