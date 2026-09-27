import { ResumeData, Experience, Education, Project } from "@/types/resume";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Plus,
  Trash2,
  Sparkles,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  FolderKanban,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
    <Icon className="h-5 w-5 text-primary" />
    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
  </div>
);

const MagicButton = ({ onClick, loading }: { onClick: () => void; loading?: boolean }) => (
  <Button
    type="button"
    size="sm"
    variant="outline"
    onClick={onClick}
    disabled={loading}
    className="gap-1.5 text-xs border-magic/30 text-magic hover:bg-magic/10 hover:text-magic"
  >
    <Sparkles className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
    {loading ? "Polishing…" : "Magic Polish"}
  </Button>
);

export default function ResumeForm({ data, onChange }: Props) {
  const [polishing, setPolishing] = useState<string | null>(null);

  const polishText = async (text: string, type: "summary" | "experience", key: string) => {
    if (!text.trim()) {
      toast.error("Please write something first so I can polish it!");
      return;
    }
    setPolishing(key);
    try {
      const { data: result, error } = await supabase.functions.invoke("polish-text", {
        body: { text, type },
      });
      if (error) throw error;
      if (result?.polished) {
        toast.success("✨ Text polished with AI!");
        return result.polished as string;
      }
      throw new Error(result?.error || "No response");
    } catch (e: any) {
      toast.error(e.message || "Failed to polish text");
      return undefined;
    } finally {
      setPolishing(null);
    }
  };

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    update(
      "experiences",
      data.experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addExperience = () => {
    update("experiences", [
      ...data.experiences,
      { id: crypto.randomUUID(), title: "", company: "", location: "", startDate: "", endDate: "", description: "" },
    ]);
  };

  const removeExperience = (id: string) => {
    if (data.experiences.length <= 1) return;
    update("experiences", data.experiences.filter((e) => e.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    update(
      "education",
      data.education.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addEducation = () => {
    update("education", [
      ...data.education,
      { id: crypto.randomUUID(), degree: "", school: "", year: "" },
    ]);
  };

  const removeEducation = (id: string) => {
    if (data.education.length <= 1) return;
    update("education", data.education.filter((e) => e.id !== id));
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    update(
      "projects",
      data.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addProject = () => {
    update("projects", [
      ...data.projects,
      { id: crypto.randomUUID(), name: "", techStack: "", link: "", description: "" },
    ]);
  };

  const removeProject = (id: string) => {
    if (data.projects.length <= 1) return;
    update("projects", data.projects.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <section>
        <SectionHeader icon={User} title="Personal Information" />
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="John Doe" value={data.fullName} onChange={(e) => update("fullName", e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="john@email.com" value={data.email} onChange={(e) => update("email", e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="(555) 123-4567" value={data.phone} onChange={(e) => update("phone", e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="San Francisco, CA" value={data.location} onChange={(e) => update("location", e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">LinkedIn</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="linkedin.com/in/johndoe" value={data.linkedin} onChange={(e) => update("linkedin", e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Professional Summary</h2>
          </div>
          <MagicButton loading={polishing === "summary"} onClick={async () => {
            const polished = await polishText(data.summary, "summary", "summary");
            if (polished) update("summary", polished);
          }} />
        </div>
        <Textarea
          placeholder="A results-driven software engineer with 5+ years of experience..."
          value={data.summary}
          onChange={(e) => update("summary", e.target.value)}
          rows={4}
          className="resize-none"
        />
      </section>

      {/* Experience */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Experience</h2>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addExperience} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <div className="space-y-6">
          {data.experiences.map((exp, i) => (
            <div key={exp.id} className="relative rounded-lg border border-border bg-card p-4 space-y-3">
              {data.experiences.length > 1 && (
                <button onClick={() => removeExperience(exp.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Job Title</Label>
                  <Input placeholder="Software Engineer" value={exp.title} onChange={(e) => updateExperience(exp.id, "title", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Company</Label>
                  <Input placeholder="Acme Corp" value={exp.company} onChange={(e) => updateExperience(exp.id, "company", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <Input placeholder="Remote" value={exp.location} onChange={(e) => updateExperience(exp.id, "location", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <Input placeholder="Jan 2020" value={exp.startDate} onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <Input placeholder="Present" value={exp.endDate} onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <MagicButton loading={polishing === exp.id} onClick={async () => {
                  const polished = await polishText(exp.description, "experience", exp.id);
                  if (polished) updateExperience(exp.id, "description", polished);
                }} />
              </div>
              <Textarea
                placeholder="• Led a team of 5 engineers to deliver a new product feature..."
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Education</h2>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addEducation} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {data.education.map((edu) => (
            <div key={edu.id} className="relative rounded-lg border border-border bg-card p-4 space-y-3">
              {data.education.length > 1 && (
                <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Degree</Label>
                <Input placeholder="B.S. Computer Science" value={edu.degree} onChange={(e) => updateEducation(edu.id, "degree", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">School</Label>
                  <Input placeholder="MIT" value={edu.school} onChange={(e) => updateEducation(edu.id, "school", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <Input placeholder="2020" value={edu.year} onChange={(e) => updateEducation(edu.id, "year", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Projects</h2>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addProject} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {data.projects.map((proj) => (
            <div key={proj.id} className="relative rounded-lg border border-border bg-card p-4 space-y-3">
              {data.projects.length > 1 && (
                <button onClick={() => removeProject(proj.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Project Name</Label>
                <Input placeholder="My Awesome App" value={proj.name} onChange={(e) => updateProject(proj.id, "name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Tech Stack</Label>
                  <Input placeholder="React, Node.js, PostgreSQL" value={proj.techStack} onChange={(e) => updateProject(proj.id, "techStack", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Link</Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="github.com/user/project" value={proj.link} onChange={(e) => updateProject(proj.id, "link", e.target.value)} className="pl-9" />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  placeholder="• Built a full-stack app that..."
                  value={proj.description}
                  onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section>
        <SectionHeader icon={Wrench} title="Skills" />
        <Textarea
          placeholder="React, TypeScript, Node.js, Python, AWS, Docker, GraphQL..."
          value={data.skills}
          onChange={(e) => update("skills", e.target.value)}
          rows={3}
          className="resize-none"
        />
      </section>
    </div>
  );
}
