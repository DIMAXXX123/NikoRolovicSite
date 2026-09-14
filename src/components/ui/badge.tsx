import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border-2 px-2.5 text-[11px] leading-none font-extrabold uppercase tracking-[0.06em] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-primary-light-border bg-primary-light text-primary-text",
        secondary: "border-[#84D8FF] bg-[#DDF4FF] text-secondary",
        destructive: "border-[#FFB3B5] bg-[#FFDFE0] text-[#EA2B2B]",
        outline: "border-border bg-background text-muted-foreground",
        gold: "border-[#FFE28A] bg-[#FFF4C4] text-[#C79000]",
        purple: "border-[#E1BDFF] bg-[#F3E3FF] text-accent-dark",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-muted",
        link: "border-transparent bg-transparent text-secondary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
