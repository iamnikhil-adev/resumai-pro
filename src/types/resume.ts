export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface Project {
  id: string;
  name: string;
  techStack: string;
  link: string;
  description: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  skills: string;
}

export const defaultResumeData: ResumeData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  summary: "",
  experiences: [
    {
      id: crypto.randomUUID(),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],
  education: [
    {
      id: crypto.randomUUID(),
      degree: "",
      school: "",
      year: "",
    },
  ],
  projects: [
    {
      id: crypto.randomUUID(),
      name: "",
      techStack: "",
      link: "",
      description: "",
    },
  ],
  skills: "",
};
