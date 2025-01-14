// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import OpenAI from 'jsr:@openai/openai'

// can't use langchain packages (e.g. SupabaseVectorStore) because they are too big for edge runtime's 10mb limit :(
Deno.serve(async (req) => {
  const payload = await req.json()
  
  const message = payload.record.message;
  const metadata = {
    messageId: payload.record.id,
    userId: payload.record.user_id,
    channelId: payload.record.channel_id,
  }

  const authHeader = req.headers.get('Authorization')!
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const openAIClient = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });

  const embeddingResponse = await openAIClient.embeddings.create({
    model: 'text-embedding-3-small',
    input: message,
  })

  const embedding = embeddingResponse.data[0].embedding;

  const { data, error } =await supabaseClient.from('documents').insert({
    content: message,
    embedding: embedding,
    metadata: metadata,
  })


  if (error) {
    return new Response(error.message, { status: 500 })
  }
  return new Response();
})