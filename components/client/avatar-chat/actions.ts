'use server'

import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";


export async function sendMessage(avatarUserId: string, message: string, prevMessages?: {role: string, content: string}[]) {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o",
    temperature: 0.1
  });

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
    }
  )

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", avatarUserId).single()
  const context = documents.map((doc) => doc.pageContent).join("\n");
  const ragMessage = `Use the following pieces of context as well as the previous messages to answer the question at the end. Pretend you are a person named ${profile.name} who has written the context and use their tone and style in your response. Use three sentences maximum and keep the answer concise.
  
  ${context}

  Question: ${message}

  Answer:`

  // Define the function that calls the model
  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const response = await llm.invoke(state.messages);
    // Update message history with response:
    return { messages: response };
  };

  // Define a new graph
  const workflow = new StateGraph(MessagesAnnotation)
    // Define the (single) node in the graph
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

  const app = workflow.compile()
  const input = prevMessages || []

  input.push(
    {
      role: "user",
      content: ragMessage,
    }
  )

  const output = await app.invoke({ messages: input });
  return output.messages[output.messages.length - 1].content.toString()
}
