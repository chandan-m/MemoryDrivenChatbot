const TypingIndicator = () => (
    <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}/>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}/>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}/>
            </div>
        </div>
        <span className="text-gray-400 text-sm">Typing...</span>
    </div>
);

export default TypingIndicator;
