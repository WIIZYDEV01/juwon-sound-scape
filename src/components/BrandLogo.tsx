import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  to?: string | null;
  className?: string;
  wordmarkClassName?: string;
}

export default function BrandLogo({
  size = 36,
  showWordmark = false,
  to = "/",
  className,
  wordmarkClassName,
}: BrandLogoProps) {
  const mark = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className="brand-logo-shine relative inline-flex shrink-0 items-center justify-center rounded-xl overflow-hidden"
        style={{ width: size, height: size }}
      >
        <img
          src={logo}
          alt="De Soundwave"
          width={size}
          height={size}
          className="relative z-[1] h-full w-full object-cover"
          draggable={false}
        />
        <span className="brand-logo-beam pointer-events-none absolute inset-0 z-[2]" aria-hidden />
      </span>
      {showWordmark && (
        <span
          className={cn(
            "text-lg font-extrabold tracking-tight text-foreground",
            wordmarkClassName
          )}
        >
          De Soundwave
        </span>
      )}
    </span>
  );

  if (!to) return mark;
  return (
    <Link to={to} className="inline-flex items-center no-underline" aria-label="De Soundwave home">
      {mark}
    </Link>
  );
}
