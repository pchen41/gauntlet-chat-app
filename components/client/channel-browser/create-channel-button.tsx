'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { createChannel } from './actions'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, 'Channel name is required'),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false)
})

type FormValues = z.infer<typeof formSchema>

export default function CreateChannelButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false
    }
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true)
      const result = await createChannel(
        values.name,
        values.description || '',
        values.isPrivate ? 'private' : 'public'
      )

      if (result.message) {
        throw new Error(result.message)
      }

      toast({
        title: 'Channel created',
        description: 'Your new channel has been created successfully.'
      })

      setOpen(false)
      form.reset()
      
      if (result.channelId) {
        router.push(`/client/channel/${result.channelId}`)
      }
    } catch (error: any) {
      toast({
        title: 'Unable to create channel',
        description: error.message,
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Channel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new channel</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Private Channel</FormLabel>
                    <FormDescription>
                      Make this channel private and invite-only
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <div className="pt-1">
              <Button type="submit" disabled={loading}>
                Create Channel
                {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}