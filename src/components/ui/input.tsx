import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[50px] w-full min-w-0 rounded-2xl border-2 border-border bg-muted px-4 py-0 text-[15px] font-bold text-foreground transition-colors outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-[13px] file:font-extrabold file:text-foreground placeholder:text-disabled focus-visible:border-secondary focus-visible:bg-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-border disabled:text-disabled aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
