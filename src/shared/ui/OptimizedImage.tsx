import React, { useState, useRef, useEffect, memo, ImgHTMLAttributes } from 'react';

interface ImageSource {
  srcSet: string;
  type: 'image/avif' | 'image/webp' | 'image/png' | 'image/jpeg';
}

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  sources?: ImageSource[];
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoadingComplete?: () => void;
}

const generateBlurPlaceholder = (width = 10, height = 10): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1"/>
      </filter>
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect width="100%" height="100%" filter="url(#b)" fill="#e5e7eb"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  sources,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  className = '',
  onLoadingComplete,
  style,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadingComplete?.();
  };

  const placeholderSrc = placeholder === 'blur'
    ? (blurDataURL || generateBlurPlaceholder(width, height))
    : undefined;

  const imgStyle: React.CSSProperties = {
    ...style,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: placeholderSrc ? `url(${placeholderSrc})` : undefined,
    backgroundSize: 'cover',
    filter: 'blur(10px)',
    transform: 'scale(1.1)',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 0 : 1,
  };

  return (
    <div style={wrapperStyle}>
      {placeholder === 'blur' && !isLoaded && (
        <div style={placeholderStyle} aria-hidden="true" />
      )}
      <picture>
        {sources?.map((source, index) => (
          <source key={index} srcSet={source.srcSet} type={source.type} sizes={sizes} />
        ))}
        <img
          ref={imgRef}
          src={isInView ? src : placeholderSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          {...(priority && { fetchpriority: 'high' })}
          onLoad={handleLoad}
          className={className}
          style={imgStyle}
          {...props}
        />
      </picture>
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
