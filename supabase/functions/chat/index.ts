import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js";
import { Hono } from 'jsr:@hono/hono';
import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
import {User, Message, UserInfo} from "./types.ts";
import {GPT_MODEL, GPT_MODEL_BEHAVIOUR, MAX_CHAT_HISTORY_CONTEXT} from "./constants.ts";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

const app = new Hono();

app.post('/chat/sendMessage', async (c) => {
    let { user_id, message } = await c.req.json();
    const user: User = await getOrCreateUser(user_id);
    user_id = user.id;

    const chatHistory = await fetchMessages(user_id, MAX_CHAT_HISTORY_CONTEXT);

    const extractUserInfo: boolean = !hasAllUserInfo(user)

    const {reply, userInfo} = await chatCompletionHelper(message, chatHistory, extractUserInfo)

    if (extractUserInfo && userInfo != null && Object.keys(userInfo).length > 0) {
        await updateUser(user_id, userInfo)
    }

    const now = new Date();
    const savedMessages = await saveMessages([
        {user_id: user_id, role: "user", content: message, timestamp: now.toISOString()},
        {user_id: user_id, role: "assistant", content: reply, timestamp: new Date(now.getTime() + 1).toISOString()},
    ])

    return c.json({
        user_id,
        reply: reply,
        savedMessages: savedMessages
    })
});

// helper

const functions = [
    {
        type: "function",
        function: {
            name: "extract_user_info",
            description: "Extracts user details from conversation",
            parameters: {
                type: "object",
                properties: {
                    name: {type: "string", description: "User's name"},
                    age: {type: "number", description: "User's age in years"},
                    gender: {type: "string", description: "User's gender"},
                },
                required: []
            }
        }
    }
]

async function chatCompletionHelper(message: string, chatHistory: Message[], extractUserInfo: boolean = false): Promise<{reply: string, userInfo?: UserInfo}> {
    chatHistory = chatHistory.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    const messages = chatHistory?.map(m => ({
        role: m.role,
        content: m.content
    })) ?? [];
    messages.push({ role: "user", content: message });
    messages.unshift({role: "system", content: GPT_MODEL_BEHAVIOUR})

    const completion = await openai.chat.completions.create({
        model: GPT_MODEL,
        stream: false,
        messages: messages,
        ...(extractUserInfo ? { tools: functions, tool_choice: "auto" } : {})
    });

    const choice = completion.choices[0]
    let assistantReply = choice.message?.content ?? null;
    let userInfo: UserInfo = null;
    if (extractUserInfo && choice.message.tool_calls?.[0]?.function.name === "extract_user_info") {
        try {
            const args = JSON.parse(choice.message.tool_calls[0].function.arguments)
            userInfo = {
                ...(args.name && {name: args.name}),
                ...(args.age && {age: args.age}),
                ...(args.gender && {gender: args.gender}),
            }
        } catch (e) {
            console.error("Error while parsing User Info from extract_user_info response", e)
        }

        if (!assistantReply) {
            const secondCall = await openai.chat.completions.create({
                model: GPT_MODEL,
                stream: false,
                messages: messages,
            });
            assistantReply = secondCall.choices[0].message?.content ?? null;
        }
    }
    return {
        reply: assistantReply,
        userInfo,
    }
}

function hasAllUserInfo(user: User): boolean {
    return user != null && user.name != null && user.age > 0 && user.gender != null;
}

// Database Access

async function getOrCreateUser(user_id?: string): Promise<User> {
    if (user_id) {
        const { data } = await supabase.from("users").select("*").eq("id", user_id).single();
        if (data) {
            return data;
        }
    }
    const newUser: User = {
        id: user_id
    }
    const { data } = await supabase.from("users").insert(newUser).select().single();
    return data
}


async function updateUser(user_id: string, updates: Partial<User>): Promise<void> {
    return supabase.from("users").update(updates).eq("id", user_id);
}

async function saveMessages(messages: Message[]): Promise<Message[]> {
    return supabase.from("messages").insert(messages).select();
}

async function fetchMessages(user_id: string, limit: number = 20, before: string = null): Promise<Message[]> {
    let query = supabase
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

app.post('/chat/getMessages', async (c) => {
    let { user_id, limit, before } = await c.req.json();
    const messages = await fetchMessages(user_id, limit, before);
    return c.json({
        messages: messages
    })
});

app.post('/chat/userInfo', async (c) => {
    let { user_id } = await c.req.json();
    const user = await getOrCreateUser(user_id);
    return c.json({
        user: user
    })
});


Deno.serve(app.fetch)

