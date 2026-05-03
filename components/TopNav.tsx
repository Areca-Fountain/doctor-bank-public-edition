import { useSession, signIn, signOut } from "next-auth/react";

interface TopNavProps {
  view: "chat" | "dashboard";
  setView: (view: "chat" | "dashboard") => void;
}

export default function TopNav({ view, setView }: TopNavProps) {
  const { data: session } = useSession();

  return (
    <div className="absolute top-0 w-full p-4 flex justify-end items-center pointer-events-none z-50">
      <div className="pointer-events-auto flex items-center gap-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100">
        {session ? (
          <>
            {session.user?.image && (
              <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
            )}
            <span className="text-sm font-semibold text-gray-700 hidden sm:block">
              {session.user?.name}
            </span>
            <button 
              onClick={() => setView(view === "chat" ? "dashboard" : "chat")} 
              className="text-sm font-bold text-blue-600 hover:text-blue-700 mx-2 transition"
            >
              {view === "chat" ? "My Dashboard" : "Back to Chat"}
            </button>
            <button 
              onClick={() => signOut()} 
              className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded-full transition font-medium"
            >
              Sign Out
            </button>
          </>
        ) : (
          <button 
            onClick={() => signIn("google")} 
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-full font-bold transition"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}