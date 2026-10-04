"use client";

import Reveal from "./Reveal";

// Edit this list to change the cards Pro users see.
const BENEFITS = [
  { icon: "🏦", title: "Sri Lankan Bank Rates", text: "Ask our AI for the lowest loan rates, best FD rates and more, from our curated, regularly updated bank database." },
  { icon: "💬", title: "Chat Without a PDF", text: "No form to upload. Ask any banking question, any time, like a personal banking assistant." },
  { icon: "♾️", title: "Unlimited Chats", text: "Start as many chats as you like with no message limit." },
  { icon: "⚡", title: "Priority Processing", text: "Your requests are handled first, so answers arrive faster." },
  { icon: "📄", title: "Smart Form Filling", text: "Still need to fill a bank form? Upload it and we will guide you step by step." },
  { icon: "🏅", title: "Pro Badge", text: "A gold Pro badge on your profile so everyone knows you are a member." },
];

function Card({ icon, title, text }: (typeof BENEFITS)[number]) {
  return (
    <div className="gold-card w-[270px] sm:w-[300px] shrink-0 p-6 flex flex-col gap-3">
      <div className="text-3xl" aria-hidden="true">{icon}</div>
      <h4 className="text-lg font-black leading-tight">{title}</h4>
      <p className="text-sm font-medium leading-relaxed text-[#4a3300]">{text}</p>
    </div>
  );
}

export default function ProBenefits() {
  return (
    <section id="benefits" className="mt-20 md:mt-32 flex flex-col items-center w-full mb-20">
      <Reveal className="text-center max-w-xl px-4">
        <h3 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tight">Your Pro Benefits</h3>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-3 text-sm md:text-base">
          Everything that comes with your Full House plan
        </p>
      </Reveal>

      {/* Two identical copies side by side -> the loop has no visible seam */}
      <div className="gold-marquee-wrap mt-10 w-full overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <div className="gold-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-5" aria-hidden={copy === 1}>
              {BENEFITS.map((b) => (
                <Card key={`${copy}-${b.title}`} {...b} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}