import { cn } from "@/lib/utils";

interface MILogoProps {
  /** Size variant - controls both width and height */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  /** Whether to show the text alongside the logo (only applies to non-icon variants) */
  showText?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Text color class - defaults to white */
  textClassName?: string;
  /** Add glow effect for dark backgrounds */
  glow?: boolean;
  /**
   * Logo type variant
   * - "icon": Icon-only white logo (no text in image) - best for heroes with headlines
   * - "lockup": Full white logo with "Mind Insurance" text - best for footers
   * - "dark": Original dark logo (for light backgrounds)
   */
  variant?: "icon" | "lockup" | "dark";
}

/**
 * Mind Insurance Logo Component
 *
 * Reusable logo component for consistent brand identity across the site.
 *
 * Logo variants:
 * - "icon": White icon-only (no text) - /images/brand/mind-insurance-logo-icon-white.png
 * - "lockup": White full lockup (with text) - /images/brand/mind-insurance-logo-white.png
 * - "dark": Original dark logo - /images/brand/mind-insurance-logo.png
 *
 * @example
 * // Hero section - icon only (headline provides brand name)
 * <MILogo size="hero" variant="icon" glow />
 *
 * @example
 * // Footer - full lockup with integrated text
 * <MILogo size="md" variant="lockup" />
 *
 * @example
 * // Sidebar - icon with separate text
 * <MILogo size="sm" variant="icon" showText />
 */
export function MILogo({
  size = "md",
  showText = false,
  className,
  textClassName = "text-white",
  glow = false,
  variant = "icon" // Default to icon for most use cases on dark backgrounds
}: MILogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
    "2xl": "w-48 h-48",
    hero: "w-72 h-72"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
    hero: "text-4xl"
  };

  // Select the appropriate logo file based on variant
  const logoSrc = {
    icon: "/images/brand/mind-insurance-logo-icon-white.png",
    lockup: "/images/brand/mind-insurance-logo-white.png",
    dark: "/images/brand/mind-insurance-logo.png"
  }[variant];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "relative",
        // Subtle glow effect: soft radial gradient backdrop only
        glow && "after:absolute after:inset-[-10%] after:bg-mi-cyan/15 after:blur-3xl after:rounded-full after:-z-10"
      )}>
        <img
          src={logoSrc}
          alt="Mind Insurance"
          className={cn(
            sizeClasses[size],
            "object-contain",
            // Subtle drop shadow for depth - single layer, reduced opacity
            glow && "drop-shadow-[0_0_40px_rgba(5,195,221,0.3)]"
          )}
        />
      </div>
      {/* Only show text for icon variant - lockup already has text in image */}
      {showText && variant === "icon" && (
        <span className={cn("font-semibold", textSizeClasses[size], textClassName)}>
          Mind Insurance
        </span>
      )}
    </div>
  );
}

export default MILogo;
