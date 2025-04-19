import React, { useState } from 'react'
import { getUserInfo } from "../api.ts";

const InfoButton: React.FC<Props> = ({ userId }) => {
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<{ name?: string; age?: number; gender?: string } | null>(null)

    const handleClick = async () => {
        setShow(v => !v)
        if (!show && !loading) {
            setLoading(true)
            try {
                const data = await getUserInfo(userId)
                setUser(data.user)
            } catch (e) {
                setUser(null)
            }
            setLoading(false)
        }
    }

    return (
        <div className="absolute top-4 right-4 z-20">
            <button
                onClick={handleClick}
                onMouseLeave={() => setShow(false)}
                className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center shadow hover:bg-orange-500 transition"
                aria-label="Show user info"
            >
                <span className="font-bold text-white text-lg">i</span>
            </button>
            {show && (
                <div
                    className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-xl p-4 text-sm animate-fade-in"
                >
                    {loading ? (
                        <div>Loading...</div>
                    ) : user ? (
                        <div>
                            <div><span className="font-medium">Name:</span> {user.name ?? '-'}</div>
                            <div><span className="font-medium">Age:</span> {user.age ?? '-'}</div>
                            <div><span className="font-medium">Gender:</span> {user.gender ?? '-'}</div>
                        </div>
                    ) : (
                        <div className="text-red-500">No user info.</div>
                    )}
                </div>
            )}
        </div>
    )
}

export default InfoButton;
