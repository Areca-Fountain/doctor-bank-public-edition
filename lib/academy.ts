// Content for the Doctor Bank Academy

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "callout"; tone: "note" | "tip" | "warning"; title?: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "code"; lang?: string; code: string }
  | { type: "cards"; items: { title: string; text: string; href: string }[] }
  | { type: "cta"; text: string; href: string; label: string };

export type AcademyPage = {
  slug: string; // overview page
  title: string;
  description: string;
  blocks: Block[];
};

export type NavGroup = { title: string; slugs: string[] };

/** Tabs along the top of the Academy */
export const topTabs: { label: string; slug: string }[] = [
  { label: "Overview", slug: "" },
  { label: "Features", slug: "features" },
  { label: "Configuration", slug: "configuration" },
];

/** Groups in the left column */
export const sidebarGroups: NavGroup[] = [
  { title: "Get started", slugs: ["quickstart", "use", "get-smart-with-work", "document-processor"] },
  { title: "Foundation", slugs: ["prompting", "plans-selection"] },
  { title: "Explore", slugs: ["whats-new", "pricing", "doctor-bank-on-the-web", "doctor-bank-on-playstore"] },
];

export const hrefFor = (slug: string) => (slug ? `/academy/${slug}` : "/academy");

export const pages: AcademyPage[] = [
  /* ------------------------------------------------------------------ */
  {
    slug: "",
    title: "Doctor Bank Academy",
    description:
      "Learn how Doctor Bank turns a blank Sri Lankan bank form into a completed application, one plain-language question at a time.",
    blocks: [
      {
        type: "p",
        text: "Doctor Bank is a conversational AI assistant for Sri Lankan banking applications. You upload a blank loan, financing, or account form as a PDF, answer simple questions, and download the completed form.",
      },
      { type: "h2", id: "the-problem", text: "The problem we solve" },
      {
        type: "p",
        text: "Bank forms are full of technical terms, legal clauses, and multi-page layouts. First-time loan applicants, young entrepreneurs, and SME owners often can't finish them alone. They end up paying agents, waiting on bank staff, or sharing private business details with people they don't know.",
      },
      {
        type: "p",
        text: "General chatbots don't fix this. They give long, generic answers that aren't written for Sri Lankan forms and procedures. Doctor Bank is built around the form you are actually holding.",
      },
      { type: "h2", id: "how-it-works", text: "How it works" },
      {
        type: "steps",
        items: [
          {
            title: "Input",
            text: "Sign in with Google, upload your blank PDF form, and answer the assistant's questions in everyday language, for example “I earn LKR 50,000 a month.”",
          },
          {
            title: "Process",
            text: "The assistant reads your form and asks one question at a time. Your chat is saved after every message so you can come back later. When it has everything, it extracts your answers and maps them to the form fields.",
          },
          {
            title: "Output",
            text: "Doctor Bank fills in the text boxes, checkboxes, and radio buttons in your PDF and downloads the finished file to your device.",
          },
        ],
      },
      { type: "h2", id: "who-its-for", text: "Who it's for" },
      {
        type: "ul",
        items: [
          "**First-time loan applicants** who have never filled in a bank application.",
          "**Young entrepreneurs** starting a business and approaching a bank for the first time.",
          "**SME business owners** who want to keep their business details private.",
          "**Anyone without a finance background** who finds banking language intimidating.",
        ],
      },
      { type: "h2", id: "privacy", text: "Privacy by design" },
      {
        type: "ul",
        items: [
          "Only signed-in users can open chats, the dashboard, and their documents.",
          "You can delete a single chat, or all of your chats, from your dashboard.",
          "Your data is never used for marketing.",
          "The assistant never asks for your bank account number, NIC, or passport number.",
        ],
      },
      {
        type: "callout",
        tone: "note",
        title: "Doctor Bank is a guide, not a bank officer",
        text: "It helps you fill in a form correctly. It doesn't approve loans or replace advice from your bank. Always read the finished form before you submit it.",
      },
      { type: "h2", id: "next", text: "Where to go next" },
      {
        type: "cards",
        items: [
          { title: "Quickstart", text: "Fill in your first form in five steps.", href: "/academy/quickstart" },
          { title: "Features", text: "Everything Doctor Bank can do.", href: "/academy/features" },
          { title: "Plans selection", text: "Free or Full House: which one fits.", href: "/academy/plans-selection" },
          { title: "Configuration", text: "Run and set up your own copy.", href: "/academy/configuration" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "features",
    title: "Features",
    description: "What Doctor Bank does for you, from the first question to the finished PDF.",
    blocks: [
      {
        type: "p",
        text: "Doctor Bank focuses on one job: getting a Sri Lankan bank application filled in correctly. These are the parts that make that work.",
      },
      { type: "h2", id: "guided-interview", text: "Guided interview" },
      {
        type: "p",
        text: "The assistant asks exactly one question per turn. When a question has choices, they are numbered, so you can reply with “2” instead of typing a sentence. Where it helps, the assistant does the maths for you, such as turning monthly income into annual income.",
      },
      { type: "h2", id: "plain-language", text: "Plain-language explanations" },
      {
        type: "p",
        text: "Stuck on a term like “collateral” or “turnover”? Switch to question mode and ask. The assistant explains it in simple words and ties the answer back to the form in front of you.",
      },
      { type: "h2", id: "pdf-upload", text: "PDF upload and form reading" },
      {
        type: "p",
        text: "Upload any blank bank, loan, or financing application as a PDF. The assistant reads the printed text on the form, so its questions follow your form rather than a generic template.",
      },
      { type: "h2", id: "auto-fill", text: "Automatic form filling" },
      {
        type: "p",
        text: "When the interview is complete, your answers are written into the form's text boxes, checkboxes, and radio buttons. The completed file downloads automatically as `Completed_Bank_Application.pdf`.",
      },
      { type: "h2", id: "guardrails", text: "Banking guardrails" },
      {
        type: "ul",
        items: [
          "The assistant acts as a strict data-entry interviewer and only works from the text printed on your form.",
          "It skips sensitive fields completely: bank account number, NIC, and passport number.",
          "It stays friendly, patient, and simple. No long essays.",
        ],
      },
      { type: "h2", id: "save-resume", text: "Saved sessions" },
      {
        type: "p",
        text: "Every message is saved. Close the tab, come back tomorrow, and continue from your dashboard exactly where you stopped.",
      },
      { type: "h2", id: "dashboard", text: "Dashboard" },
      {
        type: "p",
        text: "See your saved chats, continue any of them, delete one, or delete them all. Deleting removes the chat and its stored PDF from the platform.",
      },
      { type: "h2", id: "sign-in", text: "Google sign-in" },
      {
        type: "p",
        text: "No new password to remember. You sign in with your Google account, and only signed-in users can reach the chat, dashboard, and admin areas.",
      },
      { type: "h2", id: "interface", text: "Light, dark, and mobile-friendly" },
      {
        type: "p",
        text: "The interface uses a frosted-glass style, switches between light and dark mode, and adapts to phones, tablets, and desktops.",
      },
      { type: "h2", id: "vs-general-ai", text: "Doctor Bank compared with a general chatbot" },
      {
        type: "table",
        head: ["", "General chatbot", "Doctor Bank"],
        rows: [
          ["Knows your form", "Only if you paste the text", "Reads your uploaded PDF"],
          ["Answer style", "Long, general explanations", "One simple question at a time"],
          ["Output", "Advice you copy by hand", "A filled-in PDF to download"],
          ["Sensitive fields", "May ask for anything", "Skips account, NIC, and passport numbers"],
          ["Progress", "Lost if you close the chat", "Saved and resumable"],
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "configuration",
    title: "Configuration",
    description: "The technology behind Doctor Bank and how to run your own copy.",
    blocks: [
      {
        type: "p",
        text: "This page is for developers and project reviewers. If you only want to fill in a form, start with the Quickstart instead.",
      },
      { type: "h2", id: "tech-stack", text: "Technology stack" },
      {
        type: "table",
        head: ["Component", "Technology", "Purpose"],
        rows: [
          ["Frontend", "Next.js (React)", "Full-stack web application framework"],
          ["UI styling", "Tailwind CSS", "Responsive layouts and frosted-glass effects"],
          ["Authentication", "NextAuth.js with Google OAuth", "Secure sign-in with a Google account"],
          ["AI engine", "Google Gemini", "Conversation and structured JSON extraction"],
          ["PDF processing", "pdf-lib", "Reads and fills PDF form fields"],
          ["Database", "PostgreSQL on Neon", "Serverless cloud database"],
          ["ORM", "Prisma", "Backend-to-database layer"],
          ["Backend", "Next.js API routes", "Serverless functions for the app's logic"],
          ["Hosting", "Netlify", "Production deployment"],
          ["Payments", "PayHere", "Full House subscription checkout"],
        ],
      },
      { type: "h2", id: "requirements", text: "Requirements" },
      {
        type: "ul",
        items: [
          "Node.js and npm.",
          "A PostgreSQL database. A free Neon database works for development.",
          "A Google Cloud OAuth client for sign-in.",
          "A Google Gemini API key.",
        ],
      },
      { type: "h2", id: "setup", text: "Set up your copy" },
      {
        type: "steps",
        items: [
          { title: "Install packages", text: "Run `npm install` in the project folder." },
          {
            title: "Create your environment file",
            text: "Add a `.env.local` file in the project root using the variables in the table below.",
          },
          { title: "Prepare the database", text: "Run `npx prisma generate`, then `npx prisma migrate dev`." },
          { title: "Start the app", text: "Run `npm run dev` and open `http://localhost:3000`." },
        ],
      },
      {
        type: "code",
        lang: "bash",
        code: "npm install\nnpx prisma generate\nnpx prisma migrate dev\nnpm run dev",
      },
      {
        type: "p",
        text: "For production, `npm run build` runs `prisma generate` and then builds the app. Start it with `npm start`.",
      },
      { type: "h2", id: "env", text: "Environment variables" },
      {
        type: "table",
        head: ["Variable", "Required", "What it does"],
        rows: [
          ["`DATABASE_URL`", "Yes", "PostgreSQL connection string."],
          ["`NEXTAUTH_URL`", "Yes", "The public address of your site."],
          ["`NEXTAUTH_SECRET`", "Yes", "Secret used to sign sessions."],
          ["`GOOGLE_CLIENT_ID`", "Yes", "Google OAuth client ID."],
          ["`GOOGLE_CLIENT_SECRET`", "Yes", "Google OAuth client secret."],
          ["`GEMINI_API_KEY`", "Yes", "Key for the Gemini API. Without it the chat returns a server configuration error."],
          ["`GEMINI_MODEL`", "No", "Chooses the Gemini model without changing code."],
          ["`ADMIN_EMAILS`", "No", "Emails allowed to open the admin panel."],
          ["`PAYHERE_MERCHANT_ID`", "For billing", "PayHere merchant ID."],
          ["`PAYHERE_MERCHANT_SECRET`", "For billing", "PayHere merchant secret."],
          ["`PAYHERE_MODE`", "No", "`live` for real payments. Anything else uses the PayHere sandbox."],
          ["`PAYHERE_NOTIFY_URL`", "For billing", "Address PayHere calls to confirm a payment."],
          ["`PAYHERE_PLAN_AMOUNT`", "No", "Full House price. Defaults to 3000."],
          ["`PAYHERE_PLAN_CURRENCY`", "No", "Currency for the price above."],
          ["`NEXT_PUBLIC_PLAN_PRICE_LABEL`", "No", "Price text shown on the site. Defaults to “LKR 3,000”. Keep it in step with the amount above."],
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Keep secrets out of Git",
        text: "Never commit `.env.local`. Keys for Gemini, Google, PayHere, and your database give full access to those services.",
      },
      { type: "h2", id: "google-oauth", text: "Google sign-in" },
      {
        type: "p",
        text: "In Google Cloud, create an OAuth client and add `http://localhost:3000/api/auth/callback/google` as an authorized redirect address. When you deploy, add the same path on your live domain.",
      },
      { type: "h2", id: "protected-routes", text: "Protected areas" },
      {
        type: "p",
        text: "These routes require sign-in: `/chat`, `/dashboard`, and `/admin`. The landing page, login page, and this Academy are public.",
      },
      { type: "h2", id: "limits", text: "Plan limits" },
      {
        type: "p",
        text: "Free plan limits live in one file, `lib/plans.ts`, so the server and the interface always show the same numbers.",
      },
      {
        type: "table",
        head: ["Setting", "Default", "Meaning"],
        rows: [
          ["`FREE_CHAT_LIMIT`", "1", "Chats a Free user can start, in total."],
          ["`FREE_MESSAGE_LIMIT`", "10", "Messages a Free user can send in that chat."],
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "quickstart",
    title: "Quickstart",
    description: "Fill in your first bank form in five steps.",
    blocks: [
      {
        type: "p",
        text: "You need a blank bank form as a PDF and about ten minutes. Have your business or personal details nearby.",
      },
      { type: "h2", id: "steps", text: "Five steps to a finished form" },
      {
        type: "steps",
        items: [
          {
            title: "Sign in with Google",
            text: "Select **Start** on the home page. If you aren't signed in yet, you'll be asked to sign in with your Google account.",
          },
          {
            title: "Upload your blank PDF",
            text: "In the chat, choose **Upload PDF** and pick your bank, loan, or financing form. Only PDF files are accepted.",
          },
          {
            title: "Choose what you want to do",
            text: "Reply **1** to start an interview and fill the form, or **2** to ask a specific question about the form first.",
          },
          {
            title: "Answer one question at a time",
            text: "Answer in plain words. When options are numbered, reply with the number. Your chat saves automatically.",
          },
          {
            title: "Download your completed form",
            text: "When the last answer is in, Doctor Bank fills the PDF and downloads `Completed_Bank_Application.pdf`.",
          },
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Use a fillable PDF",
        text: "Doctor Bank writes your answers into the form's own fields. A fillable PDF (one where you can click into boxes) gets filled automatically. A flat scan has no boxes to fill, so ask your bank for the fillable version.",
      },
      {
        type: "callout",
        tone: "note",
        title: "Free plan",
        text: "The Free plan includes one chat with up to 10 messages. Choose your form carefully, and read [Plans selection](/academy/plans-selection) before you start.",
      },
      { type: "h2", id: "after", text: "After you download" },
      {
        type: "ul",
        items: [
          "Open the PDF and check every field against your documents.",
          "Fill in anything the assistant skipped on purpose, such as account, NIC, or passport numbers.",
          "Sign where the form asks for a signature, then submit it to your bank.",
        ],
      },
      {
        type: "cta",
        text: "Ready to try it?",
        href: "/chat",
        label: "Chat with Doctor Bank",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "use",
    title: "Use Doctor Bank",
    description: "Everyday use: the two modes, partial downloads, saved chats, and deleting your data.",
    blocks: [
      { type: "h2", id: "two-modes", text: "Two ways to work" },
      {
        type: "p",
        text: "Every new chat opens with a choice. Reply with the number.",
      },
      {
        type: "table",
        head: ["Reply", "Mode", "Best for"],
        rows: [
          ["1", "Start an Interview and Fill", "Completing the form. The assistant asks for your name first, then one question per turn."],
          ["2", "Ask a Specified Problem", "Understanding a term or a section. The assistant answers your questions and doesn't ask for your name."],
        ],
      },
      { type: "h2", id: "answering", text: "Answering questions" },
      {
        type: "ul",
        items: [
          "Answer the one question you were asked. You don't need to explain more.",
          "When options are numbered, reply with the number.",
          "Give income and costs as plain numbers. If you give monthly figures, the assistant calculates annual totals for you.",
          "If you don't understand a question, say so. The assistant explains it in simpler words.",
        ],
      },
      { type: "h2", id: "partial-download", text: "Download before you finish" },
      {
        type: "p",
        text: "Need a copy of your progress? Ask to download early. The assistant fills in what it has so far and gives you a partial PDF. Your chat stays open so you can continue.",
      },
      { type: "h2", id: "resume", text: "Continue later" },
      {
        type: "p",
        text: "Chats save after every message. Open the **Dashboard** from your profile picture, find the chat, and select **Continue**.",
      },
      { type: "h2", id: "delete", text: "Delete your content" },
      {
        type: "ul",
        items: [
          "Select the bin icon next to a chat to delete that chat.",
          "Select **Delete All** to remove every saved chat. This can't be undone.",
        ],
      },
      { type: "h2", id: "usage", text: "Watch your usage" },
      {
        type: "p",
        text: "On the Free plan, a usage meter shows how many chats and messages you have used. Full House has no meter because it has no limits.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Sensitive numbers stay with you",
        text: "Doctor Bank will never ask for your bank account number, NIC, or passport number. If a form needs them, write them in by hand after you download.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "get-smart-with-work",
    title: "Get smart with work",
    description: "Prepare well, understand the terms, and avoid the mistakes that get applications sent back.",
    blocks: [
      {
        type: "p",
        text: "A little preparation makes the interview faster and the form more accurate. This page is written for first-time applicants and small business owners.",
      },
      { type: "h2", id: "prepare", text: "Before you start" },
      {
        type: "ul",
        items: [
          "Get the **fillable PDF** of the right form from your bank.",
          "Collect your business name, registration details, and contact information.",
          "Write down monthly income and monthly expenses.",
          "Know what the money is for and how much you need.",
          "Have documents such as statements and registration papers beside you for reference.",
        ],
      },
      { type: "h2", id: "learn-first", text: "Learn the terms first" },
      {
        type: "p",
        text: "Start a chat in question mode (reply **2**) and ask about anything unfamiliar. Then start the interview once you feel comfortable. On the Free plan the single chat has 10 messages, so keep your questions short.",
      },
      { type: "h2", id: "glossary", text: "Common terms in plain language" },
      {
        type: "table",
        head: ["Term", "What it means"],
        rows: [
          ["Collateral", "Something valuable you pledge to the bank, such as property or equipment, in case you can't repay."],
          ["Guarantor", "A person who promises to repay your loan if you can't."],
          ["Tenure", "How long you have to repay the loan."],
          ["Interest rate", "The cost of borrowing, shown as a percentage of the amount you owe."],
          ["Working capital", "Money a business uses for everyday costs like stock, wages, and rent."],
          ["Annual turnover", "Total sales your business makes in a year, before costs are taken away."],
          ["Profit margin", "The share of your sales that is left as profit after costs."],
        ],
      },
      {
        type: "callout",
        tone: "note",
        text: "These are general explanations. Your bank's own wording and conditions always come first, so ask the bank if a form says something different.",
      },
      { type: "h2", id: "review", text: "Review before you submit" },
      {
        type: "steps",
        items: [
          { title: "Check the numbers", text: "Compare income, expenses, and amounts with your records." },
          { title: "Check names and dates", text: "Spelling errors are a common reason for delays." },
          { title: "Fill the skipped fields", text: "Add account, NIC, or passport numbers by hand." },
          { title: "Ask your bank about gaps", text: "If any box is empty, find out whether it is required." },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "document-processor",
    title: "Document processor",
    description: "How Doctor Bank reads your PDF and writes your answers back into it.",
    blocks: [
      {
        type: "p",
        text: "The document processor turns a conversation into a filled form. Knowing how it works helps you pick the right PDF and spot anything that needs a manual fix.",
      },
      { type: "h2", id: "pipeline", text: "From upload to download" },
      {
        type: "steps",
        items: [
          { title: "Upload", text: "Your browser reads the PDF and attaches it to the chat." },
          { title: "Analyze", text: "The server sends the PDF and the chat to Google Gemini, guided by the Doctor Bank instructions." },
          { title: "Save", text: "After every exchange, the chat and PDF are saved to the database so you can resume." },
          { title: "Extract", text: "When the interview ends, the assistant outputs your answers as structured data." },
          { title: "Fill", text: "The server matches each answer to a field in the PDF using the pdf-lib library." },
          { title: "Download", text: "The completed PDF is returned and downloads to your device." },
        ],
      },
      { type: "h2", id: "extracted-data", text: "What the extracted data looks like" },
      {
        type: "code",
        lang: "json",
        code: '{\n  "First Name": "John",\n  "Annual Income": "600000"\n}',
      },
      { type: "h2", id: "field-types", text: "Supported field types" },
      {
        type: "table",
        head: ["Field type", "How it is filled"],
        rows: [
          ["Text box", "The answer is typed into the box."],
          ["Checkbox", "Checked when the answer is true, yes, or x."],
          ["Radio buttons", "The matching option is selected."],
        ],
      },
      { type: "h2", id: "matching", text: "How answers find their field" },
      {
        type: "p",
        text: "Names are compared without capital letters, spaces, or punctuation, so “First Name” matches a field called `first_name`. If a field's name doesn't match any answer, it is left blank rather than guessed.",
      },
      { type: "h2", id: "limits", text: "Limits to know about" },
      {
        type: "ul",
        items: [
          "**Only fillable PDFs are filled.** A scanned or flat PDF has no form fields to write into.",
          "**Unmatched fields stay empty.** Check the finished file for gaps.",
          "**Sensitive fields are skipped by design.** Account, NIC, and passport numbers are for you to add.",
          "**Today's date** is treated as already known by the assistant.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Always review the result",
        text: "AI can make mistakes. Read the completed PDF line by line before you sign or submit it.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "prompting",
    title: "Prompting",
    description: "How the Doctor Bank assistant is instructed, and how to word your answers for the best results.",
    blocks: [
      {
        type: "p",
        text: "You don't need special prompts to use Doctor Bank. Still, understanding the rules the assistant follows helps you give it answers it can use.",
      },
      { type: "h2", id: "rules", text: "The assistant's rules" },
      {
        type: "p",
        text: "Doctor Bank runs under a fixed system prompt that you cannot change from the chat. It sets the assistant up as a strict data-entry interviewer.",
      },
      {
        type: "table",
        head: ["Rule", "Why it exists"],
        rows: [
          ["Only knows the printed text of your PDF", "Stops the assistant inventing fields or advice that isn't on your form."],
          ["Friendly, patient, and very simple", "Keeps banking language from intimidating you."],
          ["One question per turn", "Makes each step easy to answer."],
          ["Options are numbered", "Lets you reply with a single digit."],
          ["Never asks for account, NIC, or passport numbers", "Keeps your most sensitive details out of the chat."],
          ["Calculates annual figures and profit margin", "Saves you from doing sums."],
          ["Finishes the moment the last answer arrives", "Produces your filled PDF without extra steps."],
        ],
      },
      { type: "h2", id: "answers", text: "Writing good answers" },
      {
        type: "table",
        head: ["Instead of", "Try"],
        rows: [
          ["“Around fifty or so thousand?”", "“50000 per month”"],
          ["“I run a small shop and a few other things”", "“Retail shop selling groceries”"],
          ["“The second one”", "“2”"],
          ["“Not sure about the rest”", "“I don't know. Can you explain what this field means?”"],
        ],
      },
      { type: "h2", id: "good-questions", text: "Asking good questions in question mode" },
      {
        type: "ul",
        items: [
          "Point at the form: “What does ‘security offered’ mean in section 3?”",
          "Ask for the difference: “What is the difference between a guarantor and collateral?”",
          "Ask for an example: “Show me an example of a business purpose statement.”",
          "Keep each message to one topic, especially on the Free plan.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "If the assistant gets something wrong",
        text: "Correct it in the next message: “My monthly income is 80000, not 50000.” The corrected answer is used when the form is filled.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "plans-selection",
    title: "Plans selection",
    description: "Compare the Free and Full House plans and decide which one fits your form.",
    blocks: [
      {
        type: "p",
        text: "Doctor Bank has two plans. Both use the same assistant. The difference is how much you can use it.",
      },
      { type: "h2", id: "compare", text: "Free and Full House side by side" },
      {
        type: "table",
        head: ["", "Free", "Full House"],
        rows: [
          ["Intended for", "Personal use", "Commercial use"],
          ["Chats", "1 in total", "Unlimited"],
          ["Messages per chat", "10", "Unlimited"],
          ["Quick problem solving", "Yes", "Yes"],
          ["Priority processing", "No", "Yes"],
          ["Price", "Free", "See [Pricing](/academy/pricing)"],
        ],
      },
      { type: "h2", id: "choose", text: "Which plan should you pick?" },
      {
        type: "ul",
        items: [
          "**Free** suits a single, short form when you already know most of the answers.",
          "**Full House** suits long forms, several applications, or anyone helping customers or colleagues with forms.",
          "If you want to learn the terms first, then fill the form, Full House avoids running out of messages.",
        ],
      },
      { type: "h2", id: "meter", text: "How limits are counted" },
      {
        type: "ul",
        items: [
          "A **chat** is counted the first time you send a message with an uploaded PDF.",
          "A **message** is each message you send. The assistant's replies aren't counted.",
          "The Free chat allowance is for your whole account, not per month.",
        ],
      },
      {
        type: "callout",
        tone: "note",
        title: "If you reach a limit",
        text: "The assistant tells you which limit you hit and how to upgrade. Your existing chat and any PDF already created stay available in your dashboard.",
      },
      { type: "h2", id: "upgrade", text: "How to upgrade" },
      {
        type: "steps",
        items: [
          { title: "Sign in", text: "You need to be signed in before you can upgrade." },
          { title: "Open Pricing", text: "On the home page, go to the Plans & Pricing section." },
          { title: "Select Get Advanced", text: "You'll be taken to a secure PayHere checkout to pay." },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "whats-new",
    title: "What's new",
    description: "Milestones in the Doctor Bank project, newest first.",
    blocks: [
      {
        type: "p",
        text: "Doctor Bank grows in stages. Here is what has been added so far.",
      },
      { type: "h2", id: "academy", text: "Doctor Bank Academy" },
      {
        type: "ul",
        items: [
          "A documentation site with guides, plan details, and configuration help.",
          "Search and an “On this page” outline on every page.",
        ],
      },
      { type: "h2", id: "plans", text: "Plans, billing, and usage" },
      {
        type: "ul",
        items: [
          "Free and Full House plans.",
          "Secure subscription checkout with PayHere.",
          "A usage meter that shows chats and messages used on the Free plan.",
          "An admin panel for managing users and viewing activity.",
        ],
      },
      { type: "h2", id: "polish", text: "A smoother interface" },
      {
        type: "ul",
        items: [
          "Layouts for phones and tablets.",
          "Light and dark mode.",
          "Smooth scrolling and a reading-progress bar on the home page.",
        ],
      },
      { type: "h2", id: "foundation", text: "Foundation" },
      {
        type: "ul",
        items: [
          "Google sign-in with NextAuth.js.",
          "PDF processing with pdf-lib: text boxes, checkboxes, and radio buttons.",
          "Gemini-powered guided interview with banking guardrails.",
          "Chat sessions saved to PostgreSQL with Prisma, so you can resume any time.",
          "A dashboard to continue or delete your chats.",
        ],
      },
      {
        type: "callout",
        tone: "note",
        text: "Doctor Bank is a student project from Uva Wellassa University (ICT 222-2, Team Doctor Bank). Features continue to be tested and improved.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "pricing",
    title: "Pricing",
    description: "What Doctor Bank costs, how you pay, and how billing works.",
    blocks: [
      { type: "h2", id: "prices", text: "Simple pricing" },
      {
        type: "table",
        head: ["Plan", "Price", "What you get"],
        rows: [
          ["Free", "$0", "1 chat with up to 10 messages. Good for a quick problem."],
          ["Full House", "LKR 3,000 per month", "Unlimited chats and messages, plus priority processing."],
        ],
      },
      {
        type: "callout",
        tone: "note",
        title: "Check the live price",
        text: "The Plans & Pricing section on the home page always shows the current Full House price.",
      },
      { type: "h2", id: "payment", text: "How you pay" },
      {
        type: "p",
        text: "Payments go through PayHere, a Sri Lankan payment gateway. You're sent to PayHere's checkout page to pay, and Doctor Bank unlocks Full House once PayHere confirms the payment.",
      },
      { type: "h2", id: "faq", text: "Common questions" },
      { type: "h3", text: "Does Doctor Bank use my data for marketing?" },
      { type: "p", text: "No. Your data is never used for marketing." },
      { type: "h3", text: "What happens if my renewal is late?" },
      {
        type: "p",
        text: "There is a seven-day grace period after your renewal date, so a late payment confirmation doesn't lock you out straight away.",
      },
      { type: "h3", text: "Do I have to pay to try it?" },
      { type: "p", text: "No. The Free plan lets you run one complete chat before you decide." },
      {
        type: "cta",
        text: "Compare the plans in detail",
        href: "/academy/plans-selection",
        label: "Plans selection",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "doctor-bank-on-the-web",
    title: "Doctor Bank on the web",
    description: "Use Doctor Bank in your browser on a computer, tablet, or phone.",
    blocks: [
      {
        type: "p",
        text: "Doctor Bank is a web app. There is nothing to install: open the site, sign in, and start.",
      },
      { type: "h2", id: "devices", text: "Works on any device" },
      {
        type: "p",
        text: "The layout adapts to the size of your screen. On phones, the navigation collapses into a menu and the upload bar moves to the top of the chat.",
      },
      { type: "h2", id: "get-around", text: "Getting around" },
      {
        type: "table",
        head: ["Where", "What you'll find"],
        rows: [
          ["Home", "Introduction, pricing, and the team."],
          ["Academy", "These guides."],
          ["Chat", "Upload a PDF and talk to the assistant. Sign-in required."],
          ["Dashboard", "Saved chats, usage, and delete options. Sign-in required."],
          ["Light and dark mode", "The toggle sits on the right of the page on large screens, or in the menu on phones."],
        ],
      },
      { type: "h2", id: "account", text: "Your account" },
      {
        type: "p",
        text: "You sign in with Google. Your profile picture opens the dashboard, and **Sign Out** ends your session.",
      },
      { type: "h2", id: "tips", text: "Tips for a smooth session" },
      {
        type: "ul",
        items: [
          "Use an up-to-date browser such as Chrome, Edge, Safari, or Firefox.",
          "On a phone, check your downloads folder for the completed PDF.",
          "Pop-up or download blockers can stop the automatic download. Allow downloads for the site if nothing appears.",
        ],
      },
      {
        type: "cta",
        text: "Open Doctor Bank in your browser",
        href: "/chat",
        label: "Chat with Doctor Bank",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "doctor-bank-on-playstore",
    title: "Doctor Bank on Play Store",
    description: "Android app status, and how to use Doctor Bank on your phone today.",
    blocks: [
      {
        type: "callout",
        tone: "note",
        title: "Not on Google Play yet",
        text: "There is no Doctor Bank listing on the Play Store at the moment. This page will be updated when an Android app is released.",
      },
      { type: "h2", id: "today", text: "Use it on your phone today" },
      {
        type: "p",
        text: "The web app is built for phones. Open Doctor Bank in your mobile browser and everything works: sign-in, PDF upload, the chat, the dashboard, and downloads.",
      },
      { type: "h2", id: "home-screen", text: "Add it to your home screen" },
      {
        type: "steps",
        items: [
          { title: "Open the site in Chrome", text: "Go to the Doctor Bank website on your Android phone." },
          { title: "Open the browser menu", text: "Tap the three dots at the top right." },
          { title: "Add to Home screen", text: "Choose **Add to Home screen** and confirm. You'll get an icon you can tap like any other app." },
        ],
      },
      { type: "h2", id: "tips", text: "Tips for Android" },
      {
        type: "ul",
        items: [
          "Download the fillable PDF to your phone first so it's easy to find in the upload picker.",
          "Find the completed PDF in your Downloads folder or the Files app.",
          "Use a PDF viewer to check the form before you share or print it.",
        ],
      },
      {
        type: "cta",
        text: "Start from your phone's browser",
        href: "/chat",
        label: "Chat with Doctor Bank",
      },
    ],
  },
];

export const pageBySlug = (slug: string) => pages.find((p) => p.slug === slug);

/** Pages in sidebar order, used for previous / next links */
export const orderedSlugs = sidebarGroups.flatMap((g) => g.slugs);

export function headingsOf(page: AcademyPage) {
  return page.blocks.filter((b): b is Extract<Block, { type: "h2" }> => b.type === "h2").map((b) => ({ id: b.id, text: b.text }));
}
