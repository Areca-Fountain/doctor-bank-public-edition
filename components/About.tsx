"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useAnimationFrame,
  PanInfo,
} from "framer-motion";

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

// Duplicate list 3 times to guarantee smooth infinite looping wrap
const tripleTeam = [...teamMembers, ...teamMembers, ...teamMembers];

export default function About() {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Track continuous offset X position
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const baseSpeed = -0.8; // Auto-scroll speed
  const velocityRef = useRef(0);

  // Frame Loop for smooth infinite wrap and drag physics
  useAnimationFrame((_, delta) => {
    if (!contentRef.current) return;

    // Width of one single team set
    const singleSetWidth = contentRef.current.scrollWidth / 3;

    if (!isDragging) {
      // Apply momentum decay if released after drag
      velocityRef.current *= 0.95;
      
      // Target speed: pause on hover, auto-scroll when idle
      const targetSpeed = isHovered ? 0 : baseSpeed;
      const currentSpeed = targetSpeed + velocityRef.current;

      let nextX = x.get() + currentSpeed * (delta / 16);

      // Infinite modulo wrap math
      if (nextX <= -singleSetWidth) {
        nextX += singleSetWidth;
      } else if (nextX > 0) {
        nextX -= singleSetWidth;
      }

      x.set(nextX);
    }
  });

  const handleDrag = (_: any, info: PanInfo) => {
    if (!contentRef.current) return;
    const singleSetWidth = contentRef.current.scrollWidth / 3;
    
    let nextX = x.get() + info.delta.x;

    // Dynamic infinite wrap while dragging
    if (nextX <= -singleSetWidth) {
      nextX += singleSetWidth;
    } else if (nextX > 0) {
      nextX -= singleSetWidth;
    }

    x.set(nextX);
    velocityRef.current = info.velocity.x * 0.05;
  };

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

      {/* 3D Dynamic Marquee Viewport Container */}
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden py-10 cursor-grab active:cursor-grabbing select-none [perspective:1000px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left & Right Gradient Blur Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-r from-white dark:from-[#0B0512] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-l from-white dark:from-[#0B0512] to-transparent z-20 pointer-events-none" />

        {/* Dynamic Infinite Moving Track */}
        <motion.div
          ref={contentRef}
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -10000, right: 10000 }}
          dragElastic={0}
          onDragStart={() => setIsDragging(true)}
          onDrag={handleDrag}
          onDragEnd={() => setIsDragging(false)}
          className="flex gap-6 w-max [transform-style:preserve-3d]"
        >
          {tripleTeam.map((member, index) => (
            <TeamCard key={`${member.name}-${index}`} member={member} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Sub-component for individual 3D Interactive Card
function TeamCard({ member }: { member: TeamMember }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    setRotateX(-yPct * 15); // Tilt range
    setRotateY(xPct * 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative w-60 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col items-center shadow-md hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-500/50 transition-shadow duration-300 overflow-hidden [transform-style:preserve-3d]"
    >
      {/* Soft Ambient Glow on Hover */}
      <div className="absolute inset-0 bg-linear-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Profile Avatar */}
      <div className="relative w-24 h-24 rounded-full p-1 bg-linear-to-tr from-[#4C1D95] via-[#9333EA] to-purple-400 shadow-md mb-4 group-hover:scale-105 transition-transform duration-300 [transform:translateZ(20px)]">
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img 
            src={member.image} 
            alt={member.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
          />
        </div>
      </div>

      {/* Name & Role */}
      <h4 className="font-bold text-[#4C1D95] dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 [transform:translateZ(15px)]">
        {member.name}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-6 [transform:translateZ(10px)]">
        {member.role}
      </p>

      {/* Animated LinkedIn Button */}
      <a
        href={member.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-auto inline-flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-105 cursor-pointer w-full [transform:translateZ(25px)]"
      >
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
        <span>LinkedIn</span>
      </a>
    </motion.div>
  );
}