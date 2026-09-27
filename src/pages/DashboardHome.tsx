import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Pencil, Target, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ResumeRow {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("resumes")
      .select("id, title, updated_at, created_at")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load resumes");
    } else {
      setResumes(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const createResume = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("resumes")
      .insert({ user_id: user.id, title: "Untitled Resume", content: {} })
      .select("id")
      .single();

    if (error) {
      toast.error("Failed to create resume");
    } else {
      navigate(`/dashboard/builder?id=${data.id}`);
    }
  };

  const deleteResume = async (id: string) => {
    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Resume deleted");
      setResumes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Resumes</h1>
          <p className="text-sm text-muted-foreground">Manage and edit your resumes</p>
        </div>
        <Button onClick={createResume} className="gap-2">
          <Plus className="h-4 w-4" /> New Resume
        </Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-accent mx-auto flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No resumes yet</h2>
          <p className="text-muted-foreground">Create your first resume to get started</p>
          <Button onClick={createResume} className="gap-2">
            <Plus className="h-4 w-4" /> Create Resume
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((r) => (
            <div
              key={r.id}
              className="group rounded-xl border border-border bg-card p-5 space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <button
                  onClick={() => deleteResume(r.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="font-semibold text-foreground truncate">{r.title}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })}
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/builder?id=${r.id}`)}
                  className="gap-1.5 text-xs flex-1"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/ats?id=${r.id}`)}
                  className="gap-1.5 text-xs flex-1"
                >
                  <Target className="h-3 w-3" /> Analyze
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
