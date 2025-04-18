import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Hono } from 'jsr:@hono/hono';

import { ChatService } from "./logic.ts";

const chatService: ChatService = new ChatService();
const app = new Hono();

app.post('/chat/sendMessage', async (c) => {
    let { user_id, message } = await c.req.json();
    const response = await chatService.sendMessage(user_id, message)
    return c.json(response)
});

app.post('/chat/getMessages', async (c) => {
    let { user_id, limit, before } = await c.req.json();
    return c.json(await chatService.getMessages(user_id, limit, before));
});

app.post('/chat/userInfo', async (c) => {
    let { user_id } = await c.req.json();
    return c.json(await chatService.getUserInfo(user_id))
});

Deno.serve(app.fetch)

