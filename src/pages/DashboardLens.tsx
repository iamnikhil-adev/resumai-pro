import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Crosshair, Sparkles, CheckCircle2, XCircle, Zap, Rocket,
  BookOpen, FolderGit2, FileEdit, TrendingUp, Target, ArrowRight,
  Clock, ChevronDown, ChevronUp, Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// ─── Types ───────────────────────────────────────────────────
interface LensResult {
  match_score: number;
  score_breakdown: { skill_match: number; experience_match: number; keyword_coverage: number };
  summary: string;
  matched_skills: string[];
  missing_skills: string[];
  priority_actions: { rank: number; action: string; reason: string; impact: string }[];
  skill_gap_roadmap: { skill: string; importance: string; learning_path: string }[];
  project_suggestions: { title: string; description: string; skills_covered: string[] }[];
  resume_improvements: { section: string; current?: string; suggested: string; reason: string }[];
  experience_alignment: { strong_areas: string[]; weak_areas: string[]; emphasis_suggestions: string[] };
  quick_wins: { action: string; time_estimate: string }[];
  long_term_improvements: { action: string; time_estimate: string; impact: string }[];
}

interface ResumeOption { id: string; title: string }

// ─── Score Gauge ─────────────────────────────────────────────
function LensScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--lens-muted))" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-[hsl(var(--lens-foreground))]">{score}</span>
        <span className="text-xs text-[hsl(var(--lens-muted-fg))]">Match Score</span>
      </div>
    </div>
  );
}

// ─── Breakdown Bar ───────────────────────────────────────────
function LensBreakdownBar({ label, value, weight, icon }: { label: string; value: number; weight: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-[hsl(var(--lens-muted-fg))]">{icon}{label}</span>
        <span className="font-semibold text-[hsl(var(--lens-foreground))]">{value}% <span className="text-xs font-normal text-[hsl(var(--lens-muted-fg))]">({weight})</span></span>
      </div>
      <Progress value={value} className="h-2 bg-[hsl(var(--lens-muted))]" />
    </div>
  );
}

// ─── Impact Badge ────────────────────────────────────────────
const impactStyles: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const importanceStyles: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

// ─── Main Component ─────────────────────────────────────────
export default function DashboardLens() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedId, setSelectedId] = useState(searchParams.get("id") || "");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<LensResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("resumes")
      .select("id, title")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setResumes(data ?? []);
        setLoadingResumes(false);
      });
  }, [user]);

  const runAnalysis = async () => {
    if (!selectedId) { toast.error("Select a resume first"); return; }
    if (!jobDescription.trim()) { toast.error("Paste a job description"); return; }

    setLoading(true);
    setResult(null);

    const { data: resume, error } = await supabase
      .from("resumes").select("content").eq("id", selectedId).single();

    if (error || !resume) { toast.error("Failed to load resume"); setLoading(false); return; }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("lens-analyze", {
        body: { resumeContent: resume.content, jobDescription },
      });

      if (fnError) throw fnError;
      if (fnData.error) throw new Error(fnData.error);

      setResult(fnData);

      await supabase.from("lens_analyses").insert({
        resume_id: selectedId,
        job_description: jobDescription,
        match_score: fnData.match_score,
        results: fnData,
      });
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSearchParams({ id });
  };

  if (loadingResumes) {
    return (
      <div className="lens-theme p-6 max-w-5xl mx-auto space-y-4 min-h-full">
        <Skeleton className="h-10 w-64 bg-[hsl(var(--lens-muted))]" />
        <Skeleton className="h-64 rounded-xl bg-[hsl(var(--lens-muted))]" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="lens-theme p-6 max-w-3xl mx-auto text-center py-20 space-y-4 min-h-full">
        <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--lens-accent))] mx-auto flex items-center justify-center">
          <Crosshair className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-[hsl(var(--lens-foreground))]">No resumes found</h2>
        <p className="text-[hsl(var(--lens-muted-fg))]">Create a resume first, then use Lens to match it against jobs.</p>
      </div>
    );
  }

  return (
    <div className="lens-theme min-h-full bg-[hsl(var(--lens-bg))]">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[hsl(var(--lens-foreground))] flex items-center gap-2">
            <Crosshair className="h-6 w-6 text-primary" /> ResumAI Lens
          </h1>
          <p className="text-sm text-[hsl(var(--lens-muted-fg))]">
            Career intelligence — match your resume to any job and get a personalized action plan
          </p>
        </div>

        {/* Input Area */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--lens-foreground))]">Select Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedId} onValueChange={handleSelect}>
                <SelectTrigger className="bg-[hsl(var(--lens-muted))] border-[hsl(var(--lens-border))] text-[hsl(var(--lens-foreground))]">
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--lens-foreground))]">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="min-h-[120px] bg-[hsl(var(--lens-muted))] border-[hsl(var(--lens-border))] text-[hsl(var(--lens-foreground))] placeholder:text-[hsl(var(--lens-muted-fg))]"
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button onClick={runAnalysis} disabled={loading || !selectedId || !jobDescription.trim()} className="gap-2 px-8">
            <Crosshair className="h-4 w-4" /> {loading ? "Analyzing…" : "Analyze Match"}
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
            <CardContent className="p-10 text-center space-y-4">
              <div className="h-14 w-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <p className="text-[hsl(var(--lens-foreground))] font-medium">Running career intelligence analysis…</p>
              <p className="text-xs text-[hsl(var(--lens-muted-fg))]">Comparing your resume against the job requirements</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-500">

            {/* Score + Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[hsl(var(--lens-foreground))]">Match Score</CardTitle>
                </CardHeader>
                <CardContent><LensScoreGauge score={result.match_score} /></CardContent>
              </Card>

              <Card className="md:col-span-2 bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[hsl(var(--lens-foreground))]">Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[hsl(var(--lens-muted-fg))] leading-relaxed">{result.summary}</p>
                  <div className="space-y-3">
                    <LensBreakdownBar label="Skill Match" value={result.score_breakdown.skill_match} weight="40%" icon={<Target className="h-3.5 w-3.5" />} />
                    <LensBreakdownBar label="Experience" value={result.score_breakdown.experience_match} weight="30%" icon={<TrendingUp className="h-3.5 w-3.5" />} />
                    <LensBreakdownBar label="Keywords" value={result.score_breakdown.keyword_coverage} weight="30%" icon={<Crosshair className="h-3.5 w-3.5" />} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skills */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Matched Skills
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--lens-muted-fg))]">{result.matched_skills.length} skills aligned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_skills.map((s) => (
                      <Badge key={s} className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                    <XCircle className="h-4 w-4 text-red-400" /> Missing Skills
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--lens-muted-fg))]">{result.missing_skills.length} gaps identified</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs border-red-500/30 text-red-400">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 🔥 Priority Action Plan — THE MAIN SECTION */}
            <Card className="bg-[hsl(var(--lens-card))] border-primary/30 ring-1 ring-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                  <Target className="h-5 w-5 text-primary" /> What You Should Do Next
                </CardTitle>
                <CardDescription className="text-[hsl(var(--lens-muted-fg))]">Your personalized action plan, ranked by impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.priority_actions.map((a, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-lg bg-[hsl(var(--lens-muted))] border border-[hsl(var(--lens-border))]">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {a.rank}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[hsl(var(--lens-foreground))]">{a.action}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${impactStyles[a.impact] || impactStyles.medium}`}>
                            {a.impact}
                          </span>
                        </div>
                        <p className="text-xs text-[hsl(var(--lens-muted-fg))] leading-relaxed">{a.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Wins vs Long Term */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                    <Zap className="h-4 w-4 text-amber-400" /> Quick Wins
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--lens-muted-fg))]">Do these in 1–2 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.quick_wins.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-md bg-[hsl(var(--lens-muted))]">
                        <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-[hsl(var(--lens-foreground))]">{q.action}</p>
                          <p className="text-xs text-[hsl(var(--lens-muted-fg))] flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {q.time_estimate}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                    <Rocket className="h-4 w-4 text-blue-400" /> High-Impact Investments
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--lens-muted-fg))]">Takes time, but massively boosts your chances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.long_term_improvements.map((lt, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-md bg-[hsl(var(--lens-muted))]">
                        <Rocket className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-[hsl(var(--lens-foreground))]">{lt.action}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[hsl(var(--lens-muted-fg))] flex items-center gap-1"><Clock className="h-3 w-3" /> {lt.time_estimate}</span>
                            <span className="text-xs text-blue-400">→ {lt.impact}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skill Gap Roadmap */}
            <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                  <BookOpen className="h-4 w-4 text-primary" /> Skill Gap Roadmap
                </CardTitle>
                <CardDescription className="text-[hsl(var(--lens-muted-fg))]">Missing skills with learning paths</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.skill_gap_roadmap.map((sg, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-[hsl(var(--lens-muted))]">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium mt-0.5 ${importanceStyles[sg.importance] || importanceStyles.medium}`}>
                        {sg.importance}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[hsl(var(--lens-foreground))]">{sg.skill}</p>
                        <p className="text-xs text-[hsl(var(--lens-muted-fg))] mt-0.5">{sg.learning_path}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Suggestions */}
            <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                  <FolderGit2 className="h-4 w-4 text-primary" /> Suggested Projects
                </CardTitle>
                <CardDescription className="text-[hsl(var(--lens-muted-fg))]">Build these to fill your skill gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {result.project_suggestions.map((p, i) => (
                    <div key={i} className="p-4 rounded-lg bg-[hsl(var(--lens-muted))] border border-[hsl(var(--lens-border))] space-y-2">
                      <h4 className="text-sm font-semibold text-[hsl(var(--lens-foreground))]">{p.title}</h4>
                      <p className="text-xs text-[hsl(var(--lens-muted-fg))] leading-relaxed">{p.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {p.skills_covered.map((sk) => (
                          <Badge key={sk} className="bg-primary/15 text-primary border-primary/25 text-[10px]">{sk}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resume Improvements */}
            <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                  <FileEdit className="h-4 w-4 text-primary" /> Resume Improvements
                </CardTitle>
                <CardDescription className="text-[hsl(var(--lens-muted-fg))]">Specific rewrites and additions</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-2">
                  {result.resume_improvements.map((ri, i) => (
                    <AccordionItem key={i} value={`ri-${i}`} className="border-[hsl(var(--lens-border))] rounded-lg bg-[hsl(var(--lens-muted))] px-4">
                      <AccordionTrigger className="text-sm text-[hsl(var(--lens-foreground))] hover:no-underline py-3">
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-[hsl(var(--lens-border))] text-[hsl(var(--lens-muted-fg))]">{ri.section}</Badge>
                          {ri.reason}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3 space-y-2">
                        {ri.current && (
                          <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-400 font-medium mb-1">Current</p>
                            <p className="text-xs text-[hsl(var(--lens-muted-fg))]">{ri.current}</p>
                          </div>
                        )}
                        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400 font-medium mb-1">Suggested</p>
                          <p className="text-xs text-[hsl(var(--lens-foreground))]">{ri.suggested}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Experience Alignment */}
            <Card className="bg-[hsl(var(--lens-card))] border-[hsl(var(--lens-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--lens-foreground))]">
                  <TrendingUp className="h-4 w-4 text-primary" /> Experience Alignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Strong Areas</p>
                    {result.experience_alignment.strong_areas.map((a, i) => (
                      <p key={i} className="text-xs text-[hsl(var(--lens-muted-fg))] pl-4">• {a}</p>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-red-400 flex items-center gap-1"><XCircle className="h-3 w-3" /> Weak Areas</p>
                    {result.experience_alignment.weak_areas.map((a, i) => (
                      <p key={i} className="text-xs text-[hsl(var(--lens-muted-fg))] pl-4">• {a}</p>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-primary flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Emphasize More</p>
                    {result.experience_alignment.emphasis_suggestions.map((a, i) => (
                      <p key={i} className="text-xs text-[hsl(var(--lens-muted-fg))] pl-4">• {a}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Re-analyze */}
            <div className="flex justify-center pb-6">
              <Button variant="outline" onClick={runAnalysis} className="gap-2 border-[hsl(var(--lens-border))] text-[hsl(var(--lens-foreground))] hover:bg-[hsl(var(--lens-muted))]">
                <Sparkles className="h-4 w-4" /> Re-analyze
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
