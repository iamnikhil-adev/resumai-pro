# Hi 🫶
# ResumAI

**AI-powered resume builder, ATS scorer, and job-match analyzer — all in one dashboard.**

ResumAI helps job seekers build resumes that actually get past applicant tracking systems. Build your resume with a live preview, get an instant AI-driven ATS score, and run a deep "Lens" analysis against any job description to get a personalized skill-gap roadmap.

---

## ✨ Features

| | |
|---|---|
| 📝 **Resume Builder** | Split-pane editor with real-time live preview, drag-and-reorder sections, and one-click PDF export |
| 📋 **Paste-to-Import** | Paste an existing resume and have it auto-parsed into structured fields |
| 🎯 **ATS Score Checker** | AI-scored 0–100 breakdown across keywords, formatting, achievements, and action verbs — with found/missing keyword tags and prioritized suggestions |
| 🔍 **Lens: Job-Match Analysis** | Paste a job description and get a match score, skill-gap roadmap, project suggestions, quick wins, and long-term improvement plan tailored to that role |
| ✨ **AI Text Polish** | Rewrite summaries and experience bullets into sharper, ATS-friendly, action-verb-driven language |
| 🔐 **Auth & Cloud Save** | Sign in and save multiple resume versions, revisit and re-analyze anytime |

## 🧠 How the AI Works

Every AI feature runs through a Supabase Edge Function that calls an LLM gateway with a structured function-calling schema — so responses come back as clean, typed JSON (score breakdowns, keyword arrays, ranked action items) rather than freeform text. Four functions power the app:

- `analyze-resume` — ATS scoring engine
- `lens-analyze` — job-description match & roadmap engine
- `parse-resume` — pasted-text → structured resume fields
- `polish-text` — summary/experience rewriting

## 🛠️ Tech Stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui (Radix primitives) · React Router · React Hook Form + Zod · React Query
**Backend:** Supabase (Auth, Postgres, Edge Functions on Deno)
**AI:** LLM function-calling via Supabase Edge Functions
**Tooling:** ESLint · Vitest · Playwright (E2E)

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/iamnikhil-adev/resumai-pro.git
cd resumai-pro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase project URL, anon key, and AI gateway key

# Run locally
npm run dev
```

Open `http://localhost:5173` to view it.

### Other scripts

```bash
npm run build      # production build
npm run lint       # lint the codebase
npm run test       # run unit tests (Vitest)
```

## 📁 Project Structure

```
src/
├── components/
│   ├── resume/        # ResumeForm, ResumePreview, PasteResumeDialog
│   ├── dashboard/      # DashboardSidebar
│   └── ui/             # shadcn/ui component library
├── pages/
│   ├── Landing.tsx           # marketing/landing page
│   ├── Auth.tsx               # sign in / sign up
│   ├── DashboardBuilder.tsx   # resume builder + live preview
│   ├── DashboardAts.tsx       # ATS score checker
│   ├── DashboardLens.tsx      # job-match analysis
│   └── DashboardSettings.tsx
├── contexts/AuthContext.tsx
├── integrations/supabase/     # Supabase client & generated types
└── types/resume.ts            # core ResumeData schema

supabase/
├── functions/          # analyze-resume, lens-analyze, parse-resume, polish-text
└── migrations/          # database schema
```

## 📌 Roadmap

- [ ] Multiple resume templates
- [ ] Shareable public resume links
- [ ] Cover letter generator

## 🤝 Contributing

Issues and PRs are welcome — feel free to open one if you spot a bug or have an idea.

## 📄 License

This project currently has no license specified.

---

Built by [Nikhil Chandwani](https://github.com/iamnikhil-adev)
