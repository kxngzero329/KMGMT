/**
 * Editable site content, kept in code (no CMS).
 * Add only approved credentials. Leave a value empty to hide it.
 */
export const consultant = {
  name: "Kieraan",
  title: "Independent Football Career Consultant",
  portrait: "", // Approved portrait URL or public path, e.g. /images/kieraan.jpg
  bio: "Kieraan helps players and parents make sense of the next step in football. Through focused, one-on-one consultations, KMGMT offers an honest view of your situation, practical guidance on your options and a clearer plan for what comes next.",
  quote:
    "Honest advice is worth more than empty promises. My job is to help you see your situation clearly.",
  qualifications: "",
  fifaLicensing: "",
  agencyAffiliation: "",
  yearsExperience: "",
  location: "",
};

export const contactDetails = {
  email: "", // e.g. "hello@kmgmt.co.za"
  whatsapp: "", // e.g. "+27 82 000 0000"
  instagram: "", // e.g. "https://instagram.com/kmgmt"
  facebook: "", // Approved Facebook profile URL
  linkedin: "", // Approved LinkedIn profile URL
  tiktok: "", // Approved TikTok profile URL
  location: "", // e.g. "Johannesburg, South Africa"
};

/** Preview text is displayed without links until the approved contact details are filled in. */
export const contactPage = {
  placeholders: {
    email: "hello@kmgmt.example",
    whatsapp: "+27 XX XXX XXXX",
    location: "Location to be confirmed",
  },
  socials: [
    { key: "instagram", name: "Instagram", placeholder: "@kmgmt.placeholder" },
    { key: "facebook", name: "Facebook", placeholder: "KMGMT (placeholder)" },
    { key: "linkedin", name: "LinkedIn", placeholder: "KMGMT (placeholder)" },
    { key: "tiktok", name: "TikTok", placeholder: "@kmgmt.placeholder" },
  ] as const,
};

export const aboutPage = {
  principles: [
    {
      title: "The player comes first",
      text: "Your goals, your circumstances and the people supporting you matter. The conversation starts with understanding the person behind the player.",
    },
    {
      title: "Honesty creates clarity",
      text: "A realistic view of your options helps you make better decisions. Expect straightforward guidance, with room to ask the questions on your mind.",
    },
    {
      title: "Direction you can use",
      text: "Big ambitions need practical next steps. The focus is on what you can work on, prepare for and consider as your career develops.",
    },
  ],
  conversation: [
    {
      title: "Start with your story",
      text: "Talk through where you are in football, what you hope to achieve and the decisions you are facing. Players and parents are welcome.",
      detail: "Your background. Your goals. Your questions.",
    },
    {
      title: "Make sense of the options",
      text: "Explore possible pathways in the context of your current situation. Get an honest perspective on your priorities and what may need more preparation.",
      detail: "Perspective. Possibilities. Preparation.",
    },
    {
      title: "Find your next step",
      text: "Bring the conversation back to practical direction: what to focus on now, what to explore next and how that fits your longer-term ambitions.",
      detail: "Clearer priorities. A considered next move.",
    },
  ],
};

export const playersPage = {
  approach: [
    {
      title: "The person behind the player",
      text: "Every career starts with a different story. Understanding the player, their goals and their situation comes first.",
    },
    {
      title: "Perspective at every stage",
      text: "From development questions to career decisions, clear thinking helps a player make sense of the next step.",
    },
    {
      title: "Ambition with a plan",
      text: "An honest view of the options, with practical direction for the journey ahead, at home or abroad.",
    },
  ],
};

export const internationalPathways = {
  stages: [
    {
      title: "Understand the landscape",
      text: "Different leagues look for different player profiles. Explore how international markets work and where your current level might realistically fit.",
      detail: "Markets · Playing level · Realistic pathways",
    },
    {
      title: "Build your readiness",
      text: "Take an honest look at your playing background, development needs and how you present yourself. Identify what needs attention before considering a move.",
      detail: "Assessment · Preparation · Player profile",
    },
    {
      title: "Plan a considered next step",
      text: "Put your options in the context of your wider career. Understand possible routes, common pitfalls and what practical preparation could look like.",
      detail: "Career planning · Decisions · Next steps",
    },
  ],
  readiness: [
    {
      title: "Your football",
      text: "Your current level, playing history, position and development priorities.",
    },
    {
      title: "Your profile",
      text: "How your football CV and footage communicate what you bring to a team.",
    },
    {
      title: "Your expectations",
      text: "What you hope to achieve, the questions you need answered and the realities of a move.",
    },
    {
      title: "Your bigger picture",
      text: "How an international step fits your goals and the people supporting your career.",
    },
  ],
  preparation: [
    {
      title: "A football CV with a clear story",
      label: "Your playing history",
      text: "Discuss what a useful football CV includes: your position, current level, playing history and relevant experience. Understand how to present that information clearly and what to leave out.",
      takeaway: "Bring your existing CV if you have one, or notes on your playing history.",
    },
    {
      title: "Footage that shows your game",
      label: "Your highlight profile",
      text: "Explore how to structure a short, clear highlight video and choose footage that gives an honest picture of your game. The focus is on helping someone understand you as a player.",
      takeaway: "You can share a highlight video link in the booking form.",
    },
    {
      title: "Preparation for a possible trial",
      label: "Your readiness",
      text: "If a trial opportunity arises, talk through physical, mental and practical preparation. Understand the questions to ask and what you may need to work on beforehand.",
      takeaway: "Bring any details of an opportunity you are already considering.",
    },
    {
      title: "A move that fits your career",
      label: "Your longer-term plan",
      text: "Look beyond a single opportunity. Discuss short- and long-term planning, your development priorities and how a potential move could fit the wider direction of your career.",
      takeaway: "Think about where you are now and what you want your next step to achieve.",
    },
  ],
  faqs: [
    {
      q: "Will KMGMT arrange an overseas trial or contract?",
      a: "The International Career Consultation provides guidance and preparation. It does not guarantee or include arranging trials, contracts, club placements or international opportunities.",
    },
    {
      q: "Do I need to be ready to move abroad?",
      a: "No. The conversation can help you understand whether an international step makes sense now, what you might need to work on first and how it fits your career goals.",
    },
    {
      q: "Can a parent join the planning process?",
      a: "Yes. Parents are welcome to book and discuss a player's pathway. For players under 18, a parent or guardian's details and consent are required in the booking form.",
    },
  ],
};

/** Editorial guidance for the service catalogue. Prices and durations always come from Supabase. */
export const serviceGuidance: Record<
  string,
  { situation: string; eyebrow: string; focus: string[] }
> = {
  "general-football-consultation": {
    situation: "I'm not sure where to start",
    eyebrow: "Start with clarity",
    focus: ["Your current situation", "The questions on your mind", "A practical next step"],
  },
  "career-consultation": {
    situation: "I need a career plan",
    eyebrow: "See the bigger picture",
    focus: [
      "Your goals & current level",
      "Realistic career pathways",
      "Short- & long-term planning",
    ],
  },
  "international-career-consultation": {
    situation: "I'm thinking about playing abroad",
    eyebrow: "Look beyond borders",
    focus: [
      "International markets & readiness",
      "Your football CV & highlights",
      "Preparation & practical next steps",
    ],
  },
  "career-decision-consultation": {
    situation: "I have a decision to make",
    eyebrow: "Make an informed move",
    focus: ["Club offers & your options", "Staying, moving or signing", "The decision in context"],
  },
  "player-assessment-consultation": {
    situation: "I want to understand my level",
    eyebrow: "Know where you stand",
    focus: [
      "Playing history & current level",
      "Strengths & development areas",
      "Opportunities & potential barriers",
    ],
  },
};
