import { Message, User } from "./types.ts";
import { createClient } from "jsr:@supabase/supabase-js";

export class DataAccess {
    supabase;

    constructor() {
        this.supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    }

    async getOrCreateUser(user_id?: string): Promise<User> {
        if (user_id) {
            const { data } = await this.supabase.from("users").select("*").eq("id", user_id).single();
            if (data) {
                return data;
            }
        }
        const newUser: User = {
            id: user_id
        }
        const { data } = await this.supabase.from("users").insert(newUser).select().single();
        return data
    }

    async getUser(user_id?: string): Promise<User> {
        if (user_id) {
            const { data } = await this.supabase.from("users").select("*").eq("id", user_id).single();
            if (data) {
                return data;
            }
        }
    }


    async updateUser(user_id: string, updates: Partial<User>): Promise<void> {
        return this.supabase.from("users").update(updates).eq("id", user_id);
    }

    async saveMessages(messages: Message[]): Promise<Message[]> {
        const { data } = await this.supabase.from("messages").insert(messages).select();
        return data;
    }

    async fetchMessages(user_id: string, limit: number = 20, before: string = null): Promise<Message[]> {
        let query = this.supabase
            .from('messages')
            .select('*')
            .eq('user_id', user_id)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (before) {
            query = query.lt('timestamp', before);
        }

        const { data } = await query
        return data
    }
}