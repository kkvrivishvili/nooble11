import { cn } from '@/lib/utils'

interface MobilePreviewProps {
  className?: string
  children: React.ReactNode
}

export function MobilePreview({ className, children }: MobilePreviewProps) {
  return (
    <div className={cn("relative mx-auto border-4 border-gray-800 rounded-4xl w-[280px] h-[622px] bg-white overflow-hidden shadow-xl", className)}>  
      {/* Removed overflow-y-auto so content uses parent scroll */}
      <div className="relative w-full h-full bg-white">
        {children}
      </div>
    </div>
  )
}
