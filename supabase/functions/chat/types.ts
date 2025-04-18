export interface User {
    id: string; // UUID
    name?: string;
    age?: number;
    gender?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Message {
    id: string;
    user_id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

export interface UserInfo {
    name?: string;
    age?: number;
    gender?: string;
}