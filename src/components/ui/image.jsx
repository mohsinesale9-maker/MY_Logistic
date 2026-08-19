import * as React from "react"
import { useSize } from "@/hooks/use-size"
import { cn } from "@/lib/utils"

// Generic responsive image. Behaves like a plain <img> for arbitrary URLs;
// no provider-specific transform pipeline.
const FALLBACK_IMAGE_URL =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM5 19V5H19V19H5ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z'/%3E%3C/svg%3E"

const Image = React.forwardRef(({ src, alt = "", className, style, ...props }, ref) => {
  const [imgSrc, setImgSrc] = React.useState(src)

  React.useEffect(() => {
    setImgSrc(src)
  }, [src])

  if (!src) {
    return (
      <img
        ref={ref}
        src={FALLBACK_IMAGE_URL}
        alt={alt}
        className={className}
        style={style}
        data-empty-image
        {...props}
      />
    )
  }

  return (
    <img
      ref={ref}
      src={imgSrc}
      alt={alt}
      className={cn(className)}
      style={style}
      onError={() => setImgSrc(FALLBACK_IMAGE_URL)}
      {...props}
    />
  )
})
Image.displayName = "Image"

export { Image }
