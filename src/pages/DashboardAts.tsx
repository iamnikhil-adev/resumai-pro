import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Target, Sparkles, AlertTriangle, CheckCircle2, ArrowUp, Tag, Lightbulb, BarChart3, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScoreBreakdown {
  keywords: number;
  formatting: number;
  achievements: number;
  action_verbs: number;
}

interface Suggestion {
  category: "content" | "formatting" | "keywords" | "impact";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface AnalysisResult {
  ats_score: number;
  score_breakdown: ScoreBreakdown;
  found_keywords: string[];
  missing_keywords: string[];
  suggestions: Suggestion[];
  summary: string;
}

interface ResumeOption {
  id: string;
  title: string;
}

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "hsl(var(--chart-2))" : score >= 50 ? "hsl(var(--chart-4))" : "hsl(var(--destructive))";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  low: "bg-chart-2/10 text-chart-2 border-chart-2/20",
};

const categoryIcons: Record<string, React.ReactNode> = {
  content: <FileText className="h-4 w-4" />,
  formatting: <BarChart3 className="h-4 w-4" />,
  keywords: <Tag className="h-4 w-4" />,
  impact: <Lightbulb className="h-4 w-4" />,
};

export default function DashboardAts() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedId, setSelectedId] = useState(searchParams.get("id") || "");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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

  // Auto-analyze if id in URL
  useEffect(() => {
    if (selectedId && resumes.length > 0 && !analysis && !loading) {
      runAnalysis(selectedId);
    }
  }, [selectedId, resumes]);

  const runAnalysis = async (resumeId: string) => {
    setLoading(true);
    setAnalysis(null);

    const { data: resume, error } = await supabase
      .from("resumes")
      .select("content")
      .eq("id", resumeId)
      .single();

    if (error || !resume) {
      toast.error("Failed to load resume");
      setLoading(false);
      return;
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("analyze-resume", {
        body: { resumeContent: resume.content },
      });

      if (fnError) throw fnError;
      if (fnData.error) throw new Error(fnData.error);

      setAnalysis(fnData);

      // Save to analysis table
      await supabase.from("analysis").insert({
        resume_id: resumeId,
        ats_score: fnData.ats_score,
        feedback: fnData,
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
    setAnalysis(null);
    runAnalysis(id);
  };

  if (loadingResumes) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-accent mx-auto flex items-center justify-center">
          <Target className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">No resumes to analyze</h2>
        <p className="text-muted-foreground">Create a resume first, then come back to analyze it.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> ATS Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered resume analysis for applicant tracking systems</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedId} onValueChange={handleSelect}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a resume" />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground font-medium">Analyzing your resume with AI…</p>
              <p className="text-xs text-muted-foreground">This may take a few seconds</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No selection */}
      {!loading && !analysis && !selectedId && (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <Target className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Select a resume above to start the ATS analysis.</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Score + Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ATS Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreGauge score={analysis.ats_score} />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
                <div className="space-y-3">
                  <BreakdownBar label="Keywords" value={analysis.score_breakdown.keywords} icon={<Tag className="h-3.5 w-3.5" />} />
                  <BreakdownBar label="Formatting" value={analysis.score_breakdown.formatting} icon={<BarChart3 className="h-3.5 w-3.5" />} />
                  <BreakdownBar label="Achievements" value={analysis.score_breakdown.achievements} icon={<ArrowUp className="h-3.5 w-3.5" />} />
                  <BreakdownBar label="Action Verbs" value={analysis.score_breakdown.action_verbs} icon={<Sparkles className="h-3.5 w-3.5" />} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Keywords */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" /> Found Keywords
                </CardTitle>
                <CardDescription>{analysis.found_keywords.length} keywords detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.found_keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Missing Keywords
                </CardTitle>
                <CardDescription>{analysis.missing_keywords.length} keywords to add</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missing_keywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="text-xs border-destructive/30 text-destructive">{kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" /> Improvement Suggestions
              </CardTitle>
              <CardDescription>{analysis.suggestions.length} actionable recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-0.5 text-muted-foreground">{categoryIcons[s.category]}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{s.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${priorityColors[s.priority]}`}>
                          {s.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Re-analyze */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => runAnalysis(selectedId)} className="gap-2">
              <Sparkles className="h-4 w-4" /> Re-analyze
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
