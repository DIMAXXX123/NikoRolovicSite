import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[120px] w-full rounded-2xl border-2 border-border bg-muted px-4 py-3 text-[15px] leading-[1.5] font-bold text-foreground transition-colors outline-none placeholder:text-disabled focus-visible:border-secondary focus-visible:bg-background disabled:cursor-not-allowed disabled:bg-border disabled:text-disabled aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
