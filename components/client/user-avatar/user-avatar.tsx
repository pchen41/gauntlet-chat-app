import { AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials, stringToColor } from "@/lib/utils";

export default function UserAvatar({name, email, textClass}: { name: string, email?: string, textClass?: string }) {
  const color = email ? stringToColor(email) : null
  return (
    <AvatarFallback className="rounded-lg" style={color ? {backgroundColor: color} : undefined}><span className={cn('text-white', textClass)}>{getInitials(name)}</span></AvatarFallback>
  )
}