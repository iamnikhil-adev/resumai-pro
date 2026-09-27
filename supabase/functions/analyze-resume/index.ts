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

    const { resumeContent } = await req.json();
    if (!resumeContent) throw new Error("resumeContent is required");

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the resume and return a JSON response using the tool provided. Be specific and actionable in your feedback.

Score the resume 0-100 based on:
- Keyword optimization (industry-relevant terms)
- Formatting & structure (clear sections, consistent formatting)
- Quantifiable achievements (metrics, numbers, results)
- Action verbs usage
- Overall ATS compatibility

For keywords: identify important keywords found AND missing keywords that should be added based on the resume's target role.
For suggestions: provide specific, actionable improvement tips grouped by category.`;

    const userPrompt = `Analyze this resume for ATS compatibility:\n\n${JSON.stringify(resumeContent)}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ats_analysis",
              description: "Return structured ATS analysis results",
              parameters: {
                type: "object",
                properties: {
                  ats_score: { type: "number", description: "Overall ATS score 0-100" },
                  score_breakdown: {
                    type: "object",
                    properties: {
                      keywords: { type: "number", description: "Keyword score 0-100" },
                      formatting: { type: "number", description: "Formatting score 0-100" },
                      achievements: { type: "number", description: "Achievements score 0-100" },
                      action_verbs: { type: "number", description: "Action verbs score 0-100" },
                    },
                    required: ["keywords", "formatting", "achievements", "action_verbs"],
                  },
                  found_keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Industry keywords found in the resume",
                  },
                  missing_keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Important keywords missing from the resume",
                  },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["content", "formatting", "keywords", "impact"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["category", "title", "description", "priority"],
                    },
                  },
                  summary: { type: "string", description: "Brief overall assessment (2-3 sentences)" },
                },
                required: ["ats_score", "score_breakdown", "found_keywords", "missing_keywords", "suggestions", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "ats_analysis" } },
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

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
