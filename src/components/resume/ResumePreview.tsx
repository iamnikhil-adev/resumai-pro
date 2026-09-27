import { forwardRef } from "react";
import { ResumeData } from "@/types/resume";
import { Mail, Phone, MapPin, Linkedin } from "lucide-react";

interface Props {
  data: ResumeData;
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const hasContact = data.email || data.phone || data.location || data.linkedin;
  const hasExperiences = data.experiences.some((e) => e.title || e.company);
  const hasEducation = data.education.some((e) => e.degree || e.school);
  const hasProjects = (data.projects || []).some((p) => p.name || p.description);
  const hasSkills = data.skills.trim().length > 0;

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 shadow-2xl"
      style={{
        width: "8.5in",
        minHeight: "11in",
        padding: "0.75in 0.85in",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: "10pt",
        lineHeight: "1.45",
      }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h1
          className="font-bold tracking-tight"
          style={{
            fontSize: data.fullName ? "22pt" : "22pt",
            color: data.fullName ? "#1e1b4b" : "#cbd5e1",
          }}
        >
          {data.fullName || "Your Name"}
        </h1>
        {hasContact && (
          <div className="flex items-center justify-center gap-4 mt-2 text-gray-500" style={{ fontSize: "9pt" }}>
            {data.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {data.email}
              </span>
            )}
            {data.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {data.phone}
              </span>
            )}
            {data.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {data.location}
              </span>
            )}
            {data.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin className="h-3 w-3" /> {data.linkedin}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2"
            style={{ color: "#4f46e5", borderBottom: "1.5px solid #4f46e5" }}
          >
            Professional Summary
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {hasExperiences && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2"
            style={{ color: "#4f46e5", borderBottom: "1.5px solid #4f46e5" }}
          >
            Experience
          </h2>
          <div className="space-y-4">
            {data.experiences
              .filter((e) => e.title || e.company)
              .map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-semibold">{exp.title}</span>
                      {exp.company && <span className="text-gray-500"> — {exp.company}</span>}
                    </div>
                    <span className="text-gray-400 text-xs shrink-0 ml-4">
                      {[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}
                    </span>
                  </div>
                  {exp.location && <div className="text-gray-400 text-xs">{exp.location}</div>}
                  {exp.description && (
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{exp.description}</p>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Education */}
      {hasEducation && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2"
            style={{ color: "#4f46e5", borderBottom: "1.5px solid #4f46e5" }}
          >
            Education
          </h2>
          <div className="space-y-2">
            {data.education
              .filter((e) => e.degree || e.school)
              .map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold">{edu.degree}</span>
                    {edu.school && <span className="text-gray-500"> — {edu.school}</span>}
                  </div>
                  {edu.year && <span className="text-gray-400 text-xs">{edu.year}</span>}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {hasProjects && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2"
            style={{ color: "#4f46e5", borderBottom: "1.5px solid #4f46e5" }}
          >
            Projects
          </h2>
          <div className="space-y-3">
            {(data.projects || [])
              .filter((p) => p.name || p.description)
              .map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-semibold">{proj.name}</span>
                      {proj.techStack && <span className="text-gray-500"> | {proj.techStack}</span>}
                    </div>
                    {proj.link && (
                      <span className="text-gray-400 text-xs shrink-0 ml-4">{proj.link}</span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{proj.description}</p>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {hasSkills && (
        <section>
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2"
            style={{ color: "#4f46e5", borderBottom: "1.5px solid #4f46e5" }}
          >
            Skills
          </h2>
          <p className="text-gray-700">{data.skills}</p>
        </section>
      )}

      {/* Empty state */}
      {!data.fullName && !data.summary && !hasExperiences && !hasEducation && !hasProjects && !hasSkills && (
        <div className="flex flex-col items-center justify-center pt-32 text-gray-300">
          <p className="text-lg font-medium">Start filling out the form</p>
          <p className="text-sm">Your resume will appear here in real time</p>
        </div>
      )}
    </div>
  );
});

ResumePreview.displayName = "ResumePreview";

export default ResumePreview;
