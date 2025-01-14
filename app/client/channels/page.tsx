import ChannelBrowser from "@/components/client/channel-browser/channel-browser"
import { DataTable } from "@/components/data-table/data-table"
import { createClient } from "@/lib/supabase/server"

export default async function Channels() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return null
  }

  return (
    <div className="pl-8 pr-8 pt-6 flex w-[calc(100vw-16rem)] justify-center">
      <div className="w-full">
        <div className="text-2xl font-semibold leading-none tracking-tight mb-1.5">Manage Channels</div>
        <div className="text-sm text-muted-foreground">View, join and create channels</div>
        <div className="mt-6">
          <ChannelBrowser user={data.user} />
        </div>
      </div>
    </div>
  )
}