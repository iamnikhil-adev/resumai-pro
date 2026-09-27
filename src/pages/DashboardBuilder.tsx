import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { ResumeData, defaultResumeData } from "@/types/resume";
import ResumeForm from "@/components/resume/ResumeForm";
import ResumePreview from "@/components/resume/ResumePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasteResumeDialog from "@/components/resume/PasteResumeDialog";
import { Download, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function DashboardBuilder() {
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("id");
  const { user } = useAuth();

  const [data, setData] = useState<ResumeData>(defaultResumeData);
  const [title, setTitle] = useState("Untitled Resume");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!resumeId);
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: data.fullName ? `${data.fullName} - Resume` : "Resume",
  });

  // Load existing resume
  useEffect(() => {
    if (!resumeId || !user) return;
    (async () => {
      const { data: row, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .single();

      if (error) {
        toast.error("Failed to load resume");
      } else if (row) {
        setTitle(row.title);
        const content = row.content as any;
        if (content && content.fullName !== undefined) {
          setData(content as ResumeData);
        }
      }
      setLoaded(true);
    })();
  }, [resumeId, user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (resumeId) {
        const { error } = await supabase
          .from("resumes")
          .update({ title, content: data as any })
          .eq("id", resumeId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("resumes")
          .insert({ user_id: user.id, title, content: data as any });
        if (error) throw error;
      }
      toast.success("Resume saved!");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-xs font-medium"
        />
        <div className="ml-auto flex gap-2">
          <PasteResumeDialog onImport={setData} />
          <Button variant="outline" size="sm" onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
          <Button size="sm" onClick={() => handlePrint()} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-full lg:w-[480px] xl:w-[520px] shrink-0 overflow-y-auto border-r border-border bg-card p-6">
          <ResumeForm data={data} onChange={setData} />
        </aside>
        <main className="hidden lg:flex flex-1 overflow-auto items-start justify-center bg-muted/50 p-8">
          <div className="origin-top" style={{ transform: "scale(0.75)" }}>
            <ResumePreview ref={previewRef} data={data} />
          </div>
        </main>
      </div>
    </div>
  );
}
