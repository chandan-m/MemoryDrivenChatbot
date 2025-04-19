import React, {useEffect, useRef, useState} from "react";
import {getMessages, sendMessage} from "../api.ts";
import MessageBubble from "./MessageBubble.tsx";
import TypingIndicator from "./TypingIndicator.tsx";

type Message = {
    id?: string;
    user_id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
};

type Props = {
    userId: string | null;
    setUserId: (id: string) => void;
};

const PAGE_SIZE = 10;

const Chat: React.FC<Props> = ({userId, setUserId}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const chatListRef = useRef<HTMLDivElement>(null);
    const shouldScrollToBottom = useRef(false);


    // Fetch initial messages
    useEffect(() => {
        if (!userId) return;
        getMessages(userId, PAGE_SIZE).then((data) => {
            shouldScrollToBottom.current = true;
            setMessages(data.messages.reverse());
            setHasMore(data.messages.length === PAGE_SIZE);
        });
    }, [userId]);

    // Scroll to bottom on new request and reply
    useEffect(() => {
        if (shouldScrollToBottom.current && chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
            shouldScrollToBottom.current = false;
        }
    }, [messages]);

    // Pagination: fetch older messages when scrolled to top
    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const prevScrollHeight = el.scrollHeight, prevScrollTop = el.scrollTop;
        if (el.scrollTop === 0 && hasMore && userId && messages.length && !fetchingMore) {
            setFetchingMore(true);

            const before = messages[0].timestamp;
            const data = await getMessages(userId, PAGE_SIZE, before);

            setMessages((prev) => {
                setTimeout(() => { // To ensure scroll continuity
                    if (chatListRef.current) {
                        const newScrollHeight = chatListRef.current.scrollHeight;
                        chatListRef.current.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
                    }
                }, 0);
                return [...data.messages.reverse(), ...prev];
            });
            setHasMore(data.messages.length === PAGE_SIZE);
            setFetchingMore(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        setLoading(true);
        const myMsg: Message = {
            user_id: userId || "",
            role: "user",
            content: input,
            timestamp: new Date().toISOString(),
        };
        shouldScrollToBottom.current = true;
        setMessages((prev) => [...prev, myMsg]);
        setInput("");

        const data = await sendMessage(userId, input);
        if (!userId) setUserId(data.user_id);
        shouldScrollToBottom.current = true;
        setMessages((prev) => [
            ...prev.slice(0, -1),
            myMsg,
            {
                user_id: data.user_id,
                role: "assistant",
                content: data.reply,
                timestamp: new Date().toISOString(),
            },
        ]);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full">

            <div
                ref={chatListRef}
                className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
                onScroll={handleScroll}
                style={{background: "#f8fafc"}}
            >
                {fetchingMore && (
                    <div className="flex justify-center py-2 text-xs text-gray-400">Loading more...</div>
                )}
                {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} isUser={msg.role === "user"}/>
                ))}
                {loading && <TypingIndicator/>}
            </div>

            <form
                onSubmit={handleSend}
                className="flex items-center gap-2 p-3 border-t bg-white"
            >
                <input
                    type="text"
                    className="flex-1 rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="bg-orange-400 text-white rounded-full px-4 py-2 font-bold hover:bg-orange-500 transition"
                    disabled={loading}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
