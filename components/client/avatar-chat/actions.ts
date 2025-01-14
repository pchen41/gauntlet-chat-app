'use server'

import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents"

export async function sendMessage(avatarUserId: string, message: string) {
  console.log("received user id", avatarUserId)
  console.log("received message", message)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const vectorStore = new SupabaseVectorStore(
    new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY }), 
    { 
      client: supabase, 
      tableName: "documents",
      queryName: "match_documents"
    });

    const documents = await vectorStore.similaritySearch(message, 8, {
      userId: avatarUserId,
    })

    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o",
      temperature: 0.1
    });

    const ragTemplate = `Use the following pieces of context to answer the question at the end. 
    Pretend you are the person who has written the context and use their tone and style. Keep your answer concise and to the point.
    
    {context}

    Question: {question}

    Answer:`

    const ragPrompt = PromptTemplate.fromTemplate(ragTemplate);
    const ragChain = await createStuffDocumentsChain({
      llm: llm,
      prompt: ragPrompt,
      outputParser: new StringOutputParser(), // output result as string
    });

    const res = await ragChain.invoke({
      question: message,
      context: documents,
    });

    return res
}
