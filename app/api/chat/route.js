
import { NextResponse } from "next/server";
import OpenAI from "openai";

const generateSystemPrompt = (language) => {
  return `You are CodeMentor, an intelligent coding tutor designed to assist users with learning and solving software development and computing problems. Your role is to guide users through the problem-solving process, helping them understand concepts, debug issues, and learn best practices.

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
Please respond in ${language}.`; // Dynamically setting the language
};

export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: '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', // API key included here
  });

  const { messages, language } = await req.json();

  const systemPrompt = generateSystemPrompt(language);

  const updatedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: updatedMessages,
      stream: true,
    });

    const stream = new ReadableStream({
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
          console.error('Stream error:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain',
      }
    });

  } catch (err) {
    console.error('Error in OpenAI API request:', err);
    return NextResponse.json({ error: 'Error generating message' }, { status: 500 });
  }
}