import Image, { type ImageProps } from "next/image";

// next/image only optimizes raster files. SVG placeholders are served as-is.
export function Pic(props: ImageProps) {
  const isSvg = typeof props.src === "string" && props.src.endsWith(".svg");
  return <Image {...props} unoptimized={isSvg || props.unoptimized} />;
}
