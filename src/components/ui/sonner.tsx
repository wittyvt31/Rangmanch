"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-primary group-[.toaster]:border-border group-[.toaster]:shadow-lg rounded-none",
          description: "group-[.toast]:text-primary/70",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-background",
          cancelButton:
            "group-[.toast]:bg-surface group-[.toast]:text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
