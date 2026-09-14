"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-transparent px-5 text-[15px] font-extrabold uppercase tracking-[0.04em] whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-[80ms] outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-[4px] active:shadow-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF] disabled:shadow-[0_4px_0_#CECECE] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_var(--color-primary-dark)]",
        secondary:
          "bg-secondary text-[#FFFFFF] shadow-[0_4px_0_var(--color-secondary-dark)]",
        outline:
          "border-border bg-background text-secondary shadow-[0_4px_0_var(--color-border)] hover:bg-muted aria-expanded:bg-muted",
        ghost:
          "bg-transparent text-secondary shadow-none hover:bg-muted aria-expanded:bg-muted active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_4px_0_var(--color-destructive-dark)]",
        link: "bg-transparent px-0 text-secondary shadow-none underline-offset-4 hover:underline active:translate-y-0",
        gold: "bg-gold text-[#4B4B4B] shadow-[0_4px_0_var(--color-gold-dark)]",
      },
      size: {
        default: "h-[50px]",
        xs: "h-9 gap-1.5 rounded-xl px-3 text-[12px] [&_svg:not([class*='size-'])]:size-4",
        sm: "h-10 gap-1.5 rounded-xl px-4 text-[13px] [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 px-6",
        icon: "size-11 rounded-xl px-0",
        "icon-xs": "size-9 rounded-xl px-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-10 rounded-xl px-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-14 rounded-2xl px-0 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // Icon-only buttons default to the outline style (§4.1); an explicit variant still wins.
  const resolvedVariant =
    variant ?? (typeof size === "string" && size.startsWith("icon") ? "outline" : "default")
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant: resolvedVariant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
