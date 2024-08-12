import { NextResponse} from "next/server";
import OpenAI from "openai";
import { perform_rag } from "../../../indexDocumentation.mjs";
/*
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from '@pinecone-database/pinecone';
import cosine_similarity from "compute-cosine-similarity";
import { get_encoding, encoding_for_model } from "tiktoken";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";*/


const systemPrompt = `You are CodeMentor, an intelligent coding tutor designed to assist users with learning and solving software development and computing problems. Your role is to guide users through the problem-solving process, helping them understand concepts, debug issues, and learn best practices.

Key guidelines:

Understanding the Problem:

Carefully analyze the user's query to fully grasp the issue at hand.
If the problem is unclear, ask targeted questions to gather more context and details.
Teaching and Guiding:

Offer step-by-step explanations that not only solve the problem but also enhance the user's understanding.
When providing solutions, explain the underlying concepts and rationale behind each step.
Encourage users to think critically and explore different approaches to coding challenges.
Providing Code Examples:

Share well-commented, clear, and concise code snippets that illustrate the solution.
Ensure code examples are tailored to the user's skill level and include explanations of how they work.
Recommending Resources:

Suggest relevant documentation, tutorials, or tools that can deepen the user's knowledge.
Explain why these resources are valuable and how they can be effectively utilized in the learning process.
Encouraging Exploration:

Motivate users to experiment with code and try variations of the solutions provided.
Offer challenges or related problems that can help reinforce the concepts learned.
Tone and Style:

Maintain a friendly, encouraging, and patient tone that fosters a positive learning environment.
Use clear and accessible language, avoiding overly technical jargon unless appropriate for the user's level.
Be supportive and celebrate the user's progress and achievements.
Your mission is to empower users to become confident and proficient coders, guiding them on their learning journey with personalized support and insightful explanations.`


const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: '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',
});
/*
const pc = new Pinecone({
  apiKey: 'fb69c1ef-cff6-4672-a768-e64b35877930'
});
const hf_embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2",
});

//Only use these functions when inputting data to pinecone, do that through python
const tokenizer = get_encoding('p50k_base')
function tiktoken_len(text) {
  const tokens = tokenizer.encode(text);
  return tokens.length;
}

const text_splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 100,
  lengthFunction:tiktoken_len,
  separators:["\n\n", "\n", " ", ""]
})

async function get_embedding(text, model='Xenova/all-MiniLM-L6-v2') {
  const response = await hf_embeddings.embedQuery(text);
  return response;
}

async function cosine_similarity_between_words(sentence1, sentence2) {
  const embedding1 =  await get_embedding(sentence1);
  const embedding2 =  await get_embedding(sentence2);
  const embeddingArray1 = Array.from(embedding1);
  const embeddingArray2 = Array.from(embedding2);
  const similarity = cosine_similarity(embeddingArray1, embeddingArray2);
  return similarity;
}

const loader = YoutubeLoader.createFromUrl('https://www.youtube.com/watch?v=rfscVS0vtbw', {
  language: 'en',
  addVideoInfo: true,
});
const docs = await loader.load();
const texts = await text_splitter.splitDocuments(docs);


const pinecone_index = pc.Index("customer-support");

async function perform_rag(query) {
  const raw_query_embedding = await hf_embeddings.embedQuery(query);
  const top_matches = await pinecone_index.namespace('python-youtube-videos').query({
    vector: raw_query_embedding,
    topK: 3,
    includeMetadata: true,
    includeValues: true,
  });

  // get the list of retrieved texts
  const contexts = top_matches.matches.map(item => item.metadata.text);
  const augmented_query = "<CONTEXT>\n" + (contexts.slice(0, 10)).join("\n\n-------\n\n") + "\n-------\n</CONTEXT>\n\n\n\nMY QUESTION:\n" + query;

  const systemPrompt = 'You are a python coding tutor. Answer my basic questions regarding the python language using the resources from the YouTube video provided.';
  const messages = [
    {role: 'system', content: systemPrompt},
    {role: 'user', content: augmented_query}
  ];
  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct:free",
    messages: messages,
  })
  const answer = completion.choices[0].message.content;

  return answer;
} */


export async function POST(req) {
  const data = await req.json();
  const userMessage = data[data.length - 1].content; //user's last message

  let messages;

  /*
  // if message contains the word python, perform rag to ehance the query with retrieved youtube content
  if (userMessage.toLowerCase().includes("python")) {
    const raw_query_embedding = await hf_embeddings.embedQuery(userMessage);
    const top_matches = await pinecone_index.namespace('python-youtube-videos').query({
      vector: raw_query_embedding,
      topK: 3,
      includeMetadata: true,
      includeValues: true,
    });

    const contexts = top_matches.matches.map(item => item.metadata.text);
    const augmented_query = "<CONTEXT>\n" + (contexts.slice(0, 10)).join("\n\n-------\n\n") + "\n-------\n</CONTEXT>\n\n\n\nMY QUESTION:\n" + query;

    const systemPromptRag = `You are a python coding tutor. Answer my basic questions regarding the python language using the resources from the YouTube video provided.`;
    messages = [
      {role: 'system', content: systemPromptRag},
      {role: 'user', content: augmented_query}
    ];
  } else 
  { */
    // proceed with the original prompt and llm if python is not found
    messages = [
      {role: 'system', content: systemPrompt},
      ...data
    ]
  //}

  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: messages,
      stream: true,
    })

    const stream = new ReadableStream ({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    })

    return new NextResponse(stream);
  } catch(err) {
    console.error('Error in OpenAI API request:', err)
    return new NextResponse('Error generating message', {status: 500})
  }
}