import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardPaste, FileUp, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ResumeData } from "@/types/resume";

interface Props {
  onImport: (data: ResumeData) => void;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

function buildResumeData(result: any): ResumeData {
  const parsed: ResumeData = {
    fullName: result.fullName || "",
    email: result.email || "",
    phone: result.phone || "",
    location: result.location || "",
    linkedin: result.linkedin || "",
    summary: result.summary || "",
    experiences: (result.experiences || []).map((exp: any) => ({
      ...exp,
      id: crypto.randomUUID(),
    })),
    education: (result.education || []).map((edu: any) => ({
      ...edu,
      id: crypto.randomUUID(),
    })),
    projects: (result.projects || []).map((proj: any) => ({
      ...proj,
      id: crypto.randomUUID(),
    })),
    skills: result.skills || "",
  };

  if (parsed.experiences.length === 0) {
    parsed.experiences = [{ id: crypto.randomUUID(), title: "", company: "", location: "", startDate: "", endDate: "", description: "" }];
  }
  if (parsed.education.length === 0) {
    parsed.education = [{ id: crypto.randomUUID(), degree: "", school: "", year: "" }];
  }
  if (parsed.projects.length === 0) {
    parsed.projects = [{ id: crypto.randomUUID(), name: "", techStack: "", link: "", description: "" }];
  }

  return parsed;
}

export default function PasteResumeDialog({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseWithAI = async (resumeText: string) => {
    const { data: result, error } = await supabase.functions.invoke("parse-resume", {
      body: { resumeText },
    });
    if (error) throw error;
    if (result?.error) throw new Error(result.error);
    return buildResumeData(result);
  };

  const handleTextImport = async () => {
    if (!text.trim()) {
      toast.error("Please paste your resume text first");
      return;
    }
    setLoading(true);
    try {
      const parsed = await parseWithAI(text);
      onImport(parsed);
      toast.success("✨ Resume imported successfully!");
      setText("");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to parse resume");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    try {
      const extractedText = await extractTextFromPdf(file);
      if (!extractedText.trim()) {
        throw new Error("Could not extract text from PDF. Try pasting the text instead.");
      }
      const parsed = await parseWithAI(extractedText);
      onImport(parsed);
      toast.success("✨ Resume imported from PDF!");
      setFileName(null);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to parse PDF");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ClipboardPaste className="h-3.5 w-3.5" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Import Resume with AI
          </DialogTitle>
          <DialogDescription>
            Upload a PDF or paste text. AI will extract all information and auto-fill the form.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pdf" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf" className="gap-1.5">
              <FileUp className="h-3.5 w-3.5" /> Upload PDF
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-1.5">
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-sm font-medium">Extracting from {fileName}…</span>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10" />
                  <span className="text-sm font-medium">Click to upload PDF</span>
                  <span className="text-xs">Max 10MB</span>
                </>
              )}
            </button>
          </TabsContent>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <Textarea
              placeholder="Paste your resume text here — include all sections like experience, education, skills..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="resize-none text-sm"
              disabled={loading}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleTextImport} disabled={loading} className="gap-1.5">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Parsing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract & Fill
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
