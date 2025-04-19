import React, {useState} from 'react'

const ResetButton: React.FC<Props> = ({setUserId}) => {
    const [showTooltip, setShowTooltip] = useState(false)

    const handleReset = () => {
        setUserId(null);
        window.location.reload()
    }

    return (
        <div className="absolute top-16 right-4 z-2">
            <button
                onClick={handleReset}
                className="w-8 h-8 rounded-full flex items-center justify-center shadow bg-white border border-red-300 hover:bg-red-100 transition"
                aria-label="Reset user"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <span className="font-bold text-red-600 text-lg">X</span>
            </button>
            {showTooltip && (
                <div
                    className="absolute right-10 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow min-w-[96px]">
                    Reset User Id
                </div>
            )}
        </div>
    )
}

export default ResetButton;