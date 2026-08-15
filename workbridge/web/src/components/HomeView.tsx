import { useState } from "react";
import heroGraphic from "../assets/hero.png";
import officeImage from "../assets/product-office.jpg";
import peopleWorking from "../assets/people-working.jpg";
import { SiteFooter } from "./SiteFooter";

type Props = {
  onConnectOrg: () => void;
  onOpenApp: () => void;
};

const highlights = [
  {
    step: "01",
    title: "Daily standup",
    body: "Team, Me, and At risk — not a dump of the whole board.",
  },
  {
    step: "02",
    title: "Slack delivery",
    body: "The same summary posts to your channel on a schedule.",
  },
  {
    step: "03",
    title: "Jira source of truth",
    body: "Nothing is copied out of your existing project.",
  },
];

const stats = [
  { value: "09:00", label: "Weekday delivery" },
  { value: "Jira", label: "Source of work" },
  { value: "Slack", label: "Team channel" },
  { value: "1 click", label: "Org connect" },
];

export function HomeView({ onConnectOrg, onOpenApp }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const openDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  const mailto = () => {
    const subject = encodeURIComponent("WorkBridge demo request");
    const body = encodeURIComponent(
      `Name: ${name}\nWork email: ${email}\nCompany: ${company}\n\nI would like to book a demo.`,
    );
    window.location.href = `mailto:hello@workbridge.dev?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950">
      <section className="relative min-h-[620px] overflow-hidden">
        <div
          className="hero-kenburns pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${peopleWorking})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[#06122e]/70" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06122e] via-[#06122e]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(56,189,248,0.16),transparent_42%)]" />

        <div className="relative mx-auto flex min-h-[620px] max-w-[1120px] items-center px-5 py-16 sm:px-8">
          <div className="relative max-w-[620px]">
            <p className="hero-fade-up mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-sky-100">
              Jira + Slack operations
            </p>
            <h1 className="hero-fade-up-delay-1 font-display mb-5 text-[42px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[56px]">
              The daily standup your org already needs.
            </h1>
            <p className="hero-fade-up-delay-1 mb-8 max-w-[520px] text-lg leading-7 text-slate-200">
              Connect Jira, group the board, and send a clear morning brief to
              Slack. No extra project tool. No copied tickets.
            </p>
            <div className="hero-fade-up-delay-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onConnectOrg}
                className="relative cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Connect your org
              </button>
              <button
                type="button"
                onClick={openDemo}
                className="cursor-pointer rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-950"
              >
                Book a demo
              </button>
            </div>
          </div>
          <div className="ml-auto hidden w-[38%] max-w-md lg:block">
            <div className="float-soft rounded-3xl border border-white/15 bg-white/8 p-5 backdrop-blur-md">
              <img src={heroGraphic} alt="" className="w-full" />
            </div>
          </div>
        </div>

        <div className="scroll-cue absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 text-white/60">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
            Scroll
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-[1120px] px-5 sm:px-8">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:grid-cols-4">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className={`px-5 py-5 ${index > 0 ? "border-l border-slate-200" : ""}`}
            >
              <p className="font-display text-xl font-semibold tracking-tight text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-[13px] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-16 lg:flex-row">
          <div className="image-frame flex-1">
            <img
              src={officeImage}
              alt="Team collaborating in an office"
              className="w-full rounded-2xl object-cover shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
            />
          </div>
          <div className="flex-1">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-700">
              How it works
            </p>
            <h2 className="font-display mb-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Connect once. Brief every morning.
            </h2>
            <p className="mb-8 text-[17px] leading-7 text-slate-600">
              WorkBridge reads the live Jira board, writes a professional
              standup, and delivers it to Slack. Your team stays in the tools
              they already use.
            </p>
            <ol className="space-y-4">
              {[
                "Connect Jira and Slack",
                "Choose the project to brief",
                "Post or schedule the standup",
              ].map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-[15px] font-medium text-slate-800">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onConnectOrg}
                className="cursor-pointer rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Connect your org
              </button>
              <button
                type="button"
                onClick={onOpenApp}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Open standup
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="lift-card rounded-2xl border border-slate-200 bg-white p-7"
            >
              <p className="mb-6 text-[12px] font-semibold tracking-[0.14em] text-blue-700">
                {item.step}
              </p>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-[15px] leading-6 text-slate-600">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="px-5 pb-8 sm:px-8">
        <div className="mx-auto grid max-w-[1120px] overflow-hidden rounded-3xl bg-[#06122e] lg:grid-cols-2">
          <div className="px-8 py-12 sm:px-12">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-sky-300">
              Book a demo
            </p>
            <h2 className="font-display mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              See the standup with your own Jira project.
            </h2>
            <p className="max-w-md text-[15px] leading-7 text-slate-300">
              A short walkthrough of connect, briefing, and Slack delivery. No
              setup required on the call.
            </p>
          </div>
          <form
            className="space-y-4 bg-white p-8 sm:p-12"
            onSubmit={(e) => {
              e.preventDefault();
              mailto();
            }}
          >
            <label className="grid gap-1.5 text-[13px] font-medium text-slate-600">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-[15px] text-slate-950 outline-none focus:border-blue-600"
                autoComplete="name"
                required
              />
            </label>
            <label className="grid gap-1.5 text-[13px] font-medium text-slate-600">
              Work email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-[15px] text-slate-950 outline-none focus:border-blue-600"
                autoComplete="email"
                required
              />
            </label>
            <label className="grid gap-1.5 text-[13px] font-medium text-slate-600">
              Company
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-[15px] text-slate-950 outline-none focus:border-blue-600"
                autoComplete="organization"
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Request a demo
            </button>
          </form>
        </div>
      </section>

      <SiteFooter
        onConnectOrg={onConnectOrg}
        onOpenApp={onOpenApp}
        onBookDemo={openDemo}
      />
    </div>
  );
}
