#  DOCTOR BANK

## An Autonomous AI Assistant for Banking Applications

DOCTOR BANK is a conversational AI web application that helps Sri Lankan bank customers complete complex banking, loan, and financing application forms through simple, step by step conversation. Upload a blank PDF application, answer a few plain language questions, and download the completed form.

##  Introduction

Many young people have limited practical understanding of banking systems, financial procedures, and loan application processes. Complex financial terminology and formal banking documentation can be intimidating, especially for:

- Young entrepreneurs
- SME business owners
- First-time loan applicants
- Non-financial users

DOCTOR BANK bridges this gap. Instead of forcing users to understand technical banking language, our AI assistant guides them through each form using simplified questions and plain-language explanations. The assistant runs under banking-focused guardrails to reduce misleading financial guidance and improve the reliability of its responses.

## Key Features

- **Google sign-in** via NextAuth.js (Google OAuth)
- **PDF upload** of blank bank, loan, or financing application forms
- **Conversational interview** that asks one question at a time
- **Plain-language explanations** of financial terms
- **Banking-focused AI guardrails** that skip sensitive fields
- **Automatic form filling** of text boxes, checkboxes, and radio buttons
- **Continuous session saving** so you can resume any chat later
- **One-click download** of the completed application
- **Dashboard** to view history, continue chats, or delete records
- **Responsive "frosted glass" UI** built with Tailwind CSS

## Technology Stack

Frontend Framework [Next.js](https://nextjs.org) (React) Full-stack web application framework
UI Styling [Tailwind CSS](https://tailwindcss.com) Responsive UI, frosted glass effects, responsive layouts
Authentication [NextAuth.js](https://next-auth.js.org) (Google OAuth) Secure user login via Google account
AI Engine [Google Gemini 2.5 Flash](https://ai.google.dev) Conversational AI and structured JSON extraction
PDF Processing [pdf-lib](https://pdf-lib.js.org) Read and programmatically fill PDF form fields
Database [PostgreSQL (Neon)](https://neon.tech) Serverless cloud database hosting 
ORM [Prisma](https://www.prisma.io) Backend-to-database communication layer
Backend API Next.js API Routes (Node.js) Serverless functions for API logic Hosting / Deployment [Netlify](https://www.netlify.com) Cloud hosting and production deployment

### Software Resources

Next.js (React) | Frontend and backend framework 
Tailwind CSS | UI styling 
NextAuth.js | Authentication (Google OAuth provider) 
Google Generative AI SDK (`@google/generative-ai`)
pdf-lib | PDF reading and form-field manipulation
Prisma ORM | Database access layer 
PostgreSQL via Neon | Serverless database hosting 
Netlify | Hosting and deployment 
Git / GitHub 

### 3. Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### Build for production

```bash
npm run build
npm start

## Privacy and Security

Data privacy is a core design goal of DOCTOR BANK:

- **Authenticated access only** – Google OAuth through NextAuth.js ensures only authorized users reach the platform.
- **Delete anywhere** – Users can delete their chats and associated content from the platform.
- **No marketing use** – User data is never used for marketing purposes.
- **Sensitive-field avoidance** – The AI is instructed to skip fields such as passwords and full account numbers.
- **Guardrails** – A strict system prompt restricts the AI to its role as a data-entry interviewer for banking forms.
