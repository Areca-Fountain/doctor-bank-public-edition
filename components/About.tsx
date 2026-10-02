// components/About.tsx
import React from 'react';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  linkedin: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Nethsara",
    role: "Lead Developer",
    image: "/nethsaraphoto.jpg",
    linkedin: "https://www.linkedin.com/in/dumidu-gunathilaka/",
  },
  {
    name: "Pasindu",
    role: "AI Engineer",
    image: "/pasinduphoto.jpeg",
    linkedin: "https://www.linkedin.com/in/pasindu-thambugala",
  },
  {
    name: "Isuru",
    role: "UI/UX Designer",
    image: "/isuruphoto.jpg",
    linkedin: "https://www.linkedin.com/in/isuru-mihiranga-37043136a",
  },
  {
    name: "Risla",
    role: "Backend Lead",
    image: "/rislaphoto.jpeg",
    linkedin: "https://www.linkedin.com/in/risla-niyas-81346a385",
  },
  {
    name: "Samha",
    role: "Data Analyst",
    image: "/samhaphoto.jpeg",
    linkedin: "https://www.linkedin.com/in/samha-sarook-7b2679369",
  },
];

export default function About() {
  return (
    <section id="about" className="mt-32 flex flex-col items-center text-center px-4 w-full max-w-7xl mx-auto mb-24">
      <p className="tracking-[0.4em] text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-3">
        ABOUT US
      </p>
      
      <h3 className="text-4xl md:text-5xl font-black text-[#4C1D95] dark:text-white tracking-tight mb-4">
        Meet the Team
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 italic text-sm font-medium max-w-xl mb-12">
        "We are Pioneers in Building Intelligence Systems for Financing & Banking."
      </p>

      {/* 5-Card Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full justify-items-center">
        {teamMembers.map((member, index) => (
          <div 
            key={index}
            className="group relative w-full max-w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col items-center shadow-sm hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all duration-300 ease-out hover:-translate-y-2 overflow-hidden"
          >
            {/* Soft Ambient Glow on Hover */}
            <div className="absolute inset-0 bg-linear-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Profile Avatar with Hover Zoom */}
            <div className="relative w-24 h-24 rounded-full p-1 bg-linear-to-tr from-[#4C1D95] via-[#9333EA] to-purple-400 shadow-md mb-4 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Name & Role */}
            <h4 className="font-bold text-[#4C1D95] dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
              {member.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-6">
              {member.role}
            </p>

            {/* Animated LinkedIn Button */}
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-105 cursor-pointer w-full"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <span>LinkedIn</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}