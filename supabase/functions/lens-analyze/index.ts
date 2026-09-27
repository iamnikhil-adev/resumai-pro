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

    const { resumeContent, jobDescription } = await req.json();
    if (!resumeContent) throw new Error("resumeContent is required");
    if (!jobDescription) throw new Error("jobDescription is required");

    const systemPrompt = `You are an elite career intelligence advisor and job matching expert. You analyze resumes against job descriptions to provide deep, actionable career guidance.

Your goal is NOT just to score — it's to tell the user EXACTLY what to do to become the ideal candidate for this specific job.

Be specific, practical, and motivating. Reference actual details from both the resume and job description.`;

    const userPrompt = `Analyze this resume against the job description and provide comprehensive career intelligence.

RESUME:
${JSON.stringify(resumeContent)}

JOB DESCRIPTION:
${jobDescription}

Provide deep analysis using the tool provided. Be extremely specific and actionable.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "lens_analysis",
              description: "Return structured job matching and career guidance results",
              parameters: {
                type: "object",
                properties: {
                  match_score: { type: "number", description: "Overall match score 0-100" },
                  score_breakdown: {
                    type: "object",
                    properties: {
                      skill_match: { type: "number", description: "Skill match score 0-100 (40% weight)" },
                      experience_match: { type: "number", description: "Experience alignment score 0-100 (30% weight)" },
                      keyword_coverage: { type: "number", description: "Keyword coverage score 0-100 (30% weight)" },
                    },
                    required: ["skill_match", "experience_match", "keyword_coverage"],
                  },
                  summary: { type: "string", description: "2-3 sentence overall assessment of fit" },
                  matched_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills from resume that match job requirements",
                  },
                  missing_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills required by job but missing from resume",
                  },
                  priority_actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rank: { type: "number" },
                        action: { type: "string" },
                        reason: { type: "string" },
                        impact: { type: "string", enum: ["critical", "high", "medium"] },
                      },
                      required: ["rank", "action", "reason", "impact"],
                    },
                    description: "Top 5 priority actions to improve chances",
                  },
                  skill_gap_roadmap: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        importance: { type: "string", enum: ["high", "medium", "low"] },
                        learning_path: { type: "string", description: "Specific learning suggestion" },
                      },
                      required: ["skill", "importance", "learning_path"],
                    },
                  },
                  project_suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        skills_covered: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "description", "skills_covered"],
                    },
                    description: "Projects to build that fill skill gaps",
                  },
                  resume_improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        section: { type: "string" },
                        current: { type: "string" },
                        suggested: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["section", "suggested", "reason"],
                    },
                    description: "Specific resume rewrite suggestions",
                  },
                  experience_alignment: {
                    type: "object",
                    properties: {
                      strong_areas: { type: "array", items: { type: "string" } },
                      weak_areas: { type: "array", items: { type: "string" } },
                      emphasis_suggestions: { type: "array", items: { type: "string" } },
                    },
                    required: ["strong_areas", "weak_areas", "emphasis_suggestions"],
                  },
                  quick_wins: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        time_estimate: { type: "string" },
                      },
                      required: ["action", "time_estimate"],
                    },
                    description: "Things that can be done in 1-2 days",
                  },
                  long_term_improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        time_estimate: { type: "string" },
                        impact: { type: "string" },
                      },
                      required: ["action", "time_estimate", "impact"],
                    },
                    description: "High-impact improvements that take more time",
                  },
                },
                required: [
                  "match_score", "score_breakdown", "summary",
                  "matched_skills", "missing_skills", "priority_actions",
                  "skill_gap_roadmap", "project_suggestions", "resume_improvements",
                  "experience_alignment", "quick_wins", "long_term_improvements",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "lens_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
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
    console.error("lens-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
