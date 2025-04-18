import { Message, User, UserInfo } from "./types.ts";
import { GPT_MODEL, GPT_MODEL_BEHAVIOUR, MAX_CHAT_HISTORY_CONTEXT } from "./constants.ts";
import { DataAccess } from "./data_access.ts";
import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'

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

export class ChatService {
    private dataAccess: DataAccess;
    private openai;

    constructor() {
        this.dataAccess = new DataAccess();
        this.openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });
    }

    public async sendMessage(user_id: string, message: string): Promise<any> {
        const user: User = await this.dataAccess.getOrCreateUser(user_id);
        user_id = user.id;

        const chatHistory = await this.dataAccess.fetchMessages(user_id, MAX_CHAT_HISTORY_CONTEXT);

        const extractUserInfo: boolean = !this.hasAllUserInfo(user)

        const {reply, userInfo} = await this.chatCompletionHelper(message, chatHistory, extractUserInfo)

        if (extractUserInfo && userInfo != null && Object.keys(userInfo).length > 0) {
            await this.dataAccess.updateUser(user_id, userInfo)
        }

        const now = new Date();
        const savedMessages = await this.dataAccess.saveMessages([
            {user_id: user_id, role: "user", content: message, timestamp: now.toISOString()},
            {user_id: user_id, role: "assistant", content: reply, timestamp: new Date(now.getTime() + 1).toISOString()},
        ])

        return {
            user_id,
            reply: reply,
            savedMessages: savedMessages
        }
    }

    public async getMessages(user_id: string, limit: number = 20, before: string = null): Promise<any> {
        const messages = await this.dataAccess.fetchMessages(user_id, limit, before);
        return {
            messages: messages
        }
    }

    public async getUserInfo(user_id: string): Promise<any> {
        const user = await this.dataAccess.getUser(user_id);
        return {
            user: user
        }
    }

    // Helper functions

    private async chatCompletionHelper(message: string, chatHistory: Message[], extractUserInfo: boolean = false): Promise<{reply: string, userInfo?: UserInfo}> {
        chatHistory = chatHistory.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        const messages = chatHistory?.map(m => ({
            role: m.role,
            content: m.content
        })) ?? [];
        messages.push({ role: "user", content: message });
        messages.unshift({role: "system", content: GPT_MODEL_BEHAVIOUR})

        const completion = await this.openai.chat.completions.create({
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
                const secondCall = await this.openai.chat.completions.create({
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

    private hasAllUserInfo(user: User): boolean {
        return user != null && user.name != null && user.age > 0 && user.gender != null;
    }
}