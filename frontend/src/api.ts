import { supabase } from './supabaseClient'

export async function sendMessage(userId: string | null, message: string) {
    const { data, error } = await supabase.functions.invoke('chat/sendMessage', {
        body: { user_id: userId, message },
    })
    if (error) throw error
    return data
}

export async function getMessages(userId: string, limit = 20, before?: string) {
    const {data, error} = await supabase.functions.invoke('chat/getMessages', {
        body: { user_id: userId, limit, before },
    })
    if (error) throw error
    return data
}

export async function getUserInfo(userId: string) {
    const { data, error } = await supabase.functions.invoke('chat/userInfo', {
        body: { user_id: userId },
    })
    if (error) throw error
    return data
}
