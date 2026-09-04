import Image from "next/image";

type Props = {
  /** Tailwind height classes, e.g. "h-10", "h-14 md:h-20" */
  heightClass?: string;
  /** Extra classes (filter for white on dark bg, margins, mx-auto...) */
  className?: string;
  /** Alt text, default QURUX */
  alt?: string;
  priority?: boolean;
};

/**
 * QURUX script wordmark — the official logo image.
 * Use this wherever the brand name "QURUX" is shown as a logo/wordmark
 * so it always matches the Navbar logo style.
 * On dark backgrounds pass className="brightness-0 invert" for a white mark.
 */
export default function QuruxLogo({
  heightClass = "h-10",
  className = "",
  alt = "QURUX",
  priority = false,
}: Props) {
  return (
    <Image
      src="/logo/logo.png"
      alt={alt}
      width={1001}
      height={226}
      priority={priority}
      unoptimized
      className={`w-auto object-contain ${heightClass} ${className}`}
    />
  );
}
