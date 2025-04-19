import React, { useEffect, useState } from "react";
import Chat from "./components/Chat.tsx";
import InfoButton from "./components/InfoButton.tsx";
import ResetButton from "./components/ResetButton.tsx";

function App() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("userId");
        if (stored) setUserId(stored);
        console.log(import.meta.env.VITE_SUPABASE_URL);
        console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
    }, []);

    const handleUserId = (id: string) => {
        if (id == null) {
            localStorage.removeItem("userId");
        } else {
            localStorage.setItem("userId", id);
        }
        setUserId(id);
    };

    return (
        <div className="h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-lg h-full flex flex-col shadow-lg rounded-lg bg-white">
                <InfoButton userId={userId}/>
                <ResetButton  setUserId={handleUserId}/>
                <Chat userId={userId} setUserId={handleUserId} />
            </div>
        </div>
    );
}

export default App;
