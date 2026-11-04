interface AvatarProps {
  url?: string;
  name: string;
  brand: string;
  className?: string;
}

export function Avatar({ url, name, brand, className }: AvatarProps) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- user-provided avatar
    return <img src={url} alt={name} className={`${className} object-cover`} />;
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={`${className} grid place-items-center font-semibold text-white`}
      style={{ background: brand }}
    >
      {name.trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}
