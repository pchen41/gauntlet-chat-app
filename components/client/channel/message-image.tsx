'use client'

import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Separator } from '@/components/ui/separator'

interface MessageImageProps {
  src: string
  alt: string
  fileName: string
}

export function MessageImage({ src, alt, fileName }: MessageImageProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Image 
            src={src} 
            alt={alt}
            className="max-w-[200px] max-h-[200px] rounded-md object-cover"
            width={200}
            height={133}
          />
          <div className="text-xs absolute top-2 left-2 opacity-0 group-hover:opacity-95 transition-opacity bg-background/90 px-1.5 py-1 rounded-md">
            {fileName}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="p-0 border-none w-fit max-w-fit overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>
            {fileName}
          </DialogTitle>
        </VisuallyHidden>
        <div className="relative group">
          <Image
            src={src}
            alt={alt}
            className="object-contain max-w-[90vw] max-h-[90vh] w-auto h-auto"
            width={1920}
            height={1080}
            priority
            quality={100}
          />
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-90 transition-opacity bg-background/90 px-3 py-2 rounded-md flex flex-row gap-1 items-center justify-center">
            <p className="text-sm">{fileName}</p>
            <Separator orientation="vertical" className="h-4 ml-1 mr-1" />
            <a 
              href={src}
              target="_blank"
              rel="noopener noreferrer" 
              className="text-sm text-blue-500 hover:underline"
            >
              Open original
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
