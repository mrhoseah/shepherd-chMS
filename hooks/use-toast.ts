import { useToast as useToastHook } from "@/components/ui/toast"

export function useToast() {
  const { addToast } = useToastHook()
  
  return {
    toast: (options: { title?: string; description: string; variant?: "default" | "success" | "error" | "warning" | "info" | "destructive" }) => {
      // Map "destructive" to "error" for compatibility
      const variant = options.variant === "destructive" ? "error" : options.variant || "default"
      addToast({
        title: options.title,
        description: options.description,
        variant: variant as any,
      })
    },
  }
}

