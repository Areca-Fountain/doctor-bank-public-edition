// components/About.tsx
export default function About() {
  return (
    <section id="about" className="mt-40 flex flex-col items-center text-center px-4 w-full max-w-2xl mb-20">
      <p className="tracking-[0.4em] text-[11px] font-bold text-gray-400 mb-8">ABOUT US</p>
      
      <div className="w-32 h-32 rounded-full bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-2 shadow-inner">
        <div className="w-full h-full bg-brand-primary rounded-full flex items-center justify-center overflow-hidden shadow-md">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 14.5C19.5 14.5 21 14.5 21 12.5C21 10.5 19.5 10.5 19.5 10.5V9C19.5 7.5 18 6 15 6C15 6 14.5 4.5 13 4.5H11C9.5 4.5 9 6 9 6C6 6 4.5 7.5 4.5 9V14.5C4.5 14.5 3 14.5 3 16.5C3 18.5 4.5 18.5 4.5 18.5V20H7.5V18.5H16.5V20H19.5V18.5C19.5 18.5 21 18.5 21 16.5C21 14.5 19.5 14.5 19.5 14.5ZM7.5 10.5C6.67 10.5 6 9.83 6 9C6 8.17 6.67 7.5 7.5 7.5C8.33 7.5 9 8.17 9 9C9 9.83 8.33 10.5 7.5 10.5Z"/>
          </svg>
        </div>
      </div>

      <h4 className="mt-6 font-black text-brand-primary dark:text-white text-sm tracking-widest uppercase">
        Doctor Bank
      </h4>
      <p className="mt-2 text-gray-500 dark:text-gray-400 italic text-xs font-medium">
        " We are Pioneers in Building Intelligence <br className="hidden md:block" /> Systems for Financing & Banking."
      </p>
    </section>
  );
}