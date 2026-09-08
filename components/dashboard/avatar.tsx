interface AvatarProps {
  url?: string;
  name: string;
  brand: string;
  className?: string;
}

/** User avatar image with a ui-avatars fallback derived from the user's name. */
export function Avatar({ url, name, brand, className }: AvatarProps) {
  const src =
    url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${brand.replace("#", "")}&color=fff&bold=true`;
  // eslint-disable-next-line @next/next/no-img-element -- dynamic remote avatar URL
  return <img src={src} alt={name} className={`${className} object-cover`} />;
}