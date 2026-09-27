import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { resumeText } = await req.json();
    if (!resumeText?.trim()) throw new Error("resumeText is required");

    const systemPrompt = `You are an expert resume parser. Extract ALL information from the pasted resume text into a structured format using the tool provided. Be thorough — capture every experience, education entry, and skill mentioned. For descriptions, preserve bullet points (prefix with •). If a field is not found, use an empty string.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this resume:\n\n${resumeText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_resume",
              description: "Return structured resume data extracted from text",
              parameters: {
                type: "object",
                properties: {
                  fullName: { type: "string", description: "Full name of the candidate" },
                  email: { type: "string", description: "Email address" },
                  phone: { type: "string", description: "Phone number" },
                  location: { type: "string", description: "City, State or full address" },
                  linkedin: { type: "string", description: "LinkedIn URL or profile path" },
                  summary: { type: "string", description: "Professional summary or objective" },
                  experiences: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        company: { type: "string" },
                        location: { type: "string" },
                        startDate: { type: "string" },
                        endDate: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "company", "location", "startDate", "endDate", "description"],
                    },
                  },
                  education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        degree: { type: "string" },
                        school: { type: "string" },
                        year: { type: "string" },
                      },
                      required: ["degree", "school", "year"],
                    },
                  },
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        techStack: { type: "string" },
                        link: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "techStack", "link", "description"],
                    },
                  },
                  skills: { type: "string", description: "Comma-separated list of skills" },
                },
                required: ["fullName", "email", "phone", "location", "linkedin", "summary", "experiences", "education", "projects", "skills"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_resume" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
