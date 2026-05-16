interface IllusBannerProps {
  opacity?: number;
}

export default function IllusBanner({ opacity = 0.45 }: IllusBannerProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/illustrations/illus-banner.png"
      alt=""
      aria-hidden="true"
      className="illus-banner block w-full h-auto pointer-events-none select-none"
      style={{ opacity, objectFit: "contain" }}
    />
  );
}
