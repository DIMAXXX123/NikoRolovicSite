"use client"

import { createContext, useContext } from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// When `Tabs` gets an explicit `id`, every trigger derives a deterministic
// `id` from it (`<id>-<value>`) instead of React.useId(). useId-based ids
// hydrate with a different tree position in `next dev` every now and then
// (a Next 16 dev-mode quirk, see docs/screens/console-*.json), which shows up
// as a "server rendered HTML didn't match" warning on the tab buttons.
const TabsIdContext = createContext<string | undefined>(undefined)

function Tabs({
  className,
  orientation = "horizontal",
  id,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsIdContext.Provider value={id}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        id={id}
        className={cn(
          "group/tabs flex gap-3 data-horizontal:flex-col",
          className
        )}
        {...props}
      />
    </TabsIdContext.Provider>
  )
}

// Segmented control (§4.4). The `line` variant is kept for API compatibility
// but renders the same segmented control — no underline tabs anywhere.
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-border bg-muted p-1 text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "",
        line: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, id, value, ...props }: TabsPrimitive.Tab.Props) {
  const tabsId = useContext(TabsIdContext)
  const stableId =
    id ?? (tabsId !== undefined && value !== undefined ? `${tabsId}-${String(value)}` : undefined)
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      id={stableId}
      value={value}
      className={cn(
        "relative inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-transparent px-2 text-[13px] leading-none font-extrabold uppercase tracking-[0.04em] whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-120 select-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:text-disabled aria-disabled:pointer-events-none aria-disabled:text-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-active:border-border data-active:bg-background data-active:text-secondary data-active:shadow-[0_2px_0_var(--color-border)]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-[15px] outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
