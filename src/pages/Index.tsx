import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { ResumeData, defaultResumeData } from "@/types/resume";
import ResumeForm from "@/components/resume/ResumeForm";
import ResumePreview from "@/components/resume/ResumePreview";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function Index() {
  const [data, setData] = useState<ResumeData>(defaultResumeData);
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: data.fullName ? `${data.fullName} - Resume` : "Resume",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Resum<span className="text-primary">AI</span>
          </span>
        </div>
        <Button onClick={() => handlePrint()} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </header>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left – Form */}
        <aside className="w-full lg:w-[480px] xl:w-[520px] shrink-0 overflow-y-auto border-r border-border bg-card p-6">
          <ResumeForm data={data} onChange={setData} />
        </aside>

        {/* Right – Preview */}
        <main className="hidden lg:flex flex-1 overflow-auto items-start justify-center bg-muted/50 p-8">
          <div className="origin-top" style={{ transform: "scale(0.75)" }}>
            <ResumePreview ref={previewRef} data={data} />
          </div>
        </main>
      </div>
    </div>
  );
}
