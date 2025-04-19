import React from "react";

type Props = {
    message: {
        content: string;
        role: "user" | "assistant";
        timestamp?: string;
    };
    isUser: boolean;
};

const MessageBubble: React.FC<Props> = ({message, isUser}) => (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
            className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                isUser
                    ? "bg-orange-400 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
            }`}
        >
            <span className="block">{message.content}</span>
            {message.timestamp && (
                <span className="block text-xs text-right text-gray-500 mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
        </span>
            )}
        </div>
    </div>
);

export default MessageBubble;
