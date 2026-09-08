/** Compatibility shim for `next/image`. */
import { forwardRef, type ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  priority?: boolean;
  fill?: boolean;
  quality?: number;
  unoptimized?: boolean;
};

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { priority: _p, fill, quality: _q, unoptimized: _u, style, ...rest },
  ref,
) {
  return (
    <img
      ref={ref}
      loading={_p ? "eager" : "lazy"}
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...rest}
    />
  );
});

export default Image;
