interface IllusMarkProps {
  src: string;
  width: number;
  className?: string;
  opacity?: number;
  alt?: string;
}

export default function IllusMark({
  src,
  width,
  className = "",
  opacity = 0.34,
  alt = "",
}: IllusMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      aria-hidden="true"
      className={`illus-mark absolute pointer-events-none select-none z-0 ${className}`}
      style={{ width, height: "auto", opacity }}
    />
  );
}
