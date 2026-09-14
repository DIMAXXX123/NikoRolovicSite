"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "mb-1.5 flex items-center gap-2 text-[13px] leading-none font-extrabold tracking-[0.04em] text-muted-foreground uppercase select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-disabled peer-disabled:cursor-not-allowed peer-disabled:text-disabled",
        className
      )}
      {...props}
    />
  )
}

export { Label }
