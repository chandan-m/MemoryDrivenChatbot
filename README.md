# MemoryDrivenChatbot

Web-based AI assistant that chats naturally with users while subtly learning and storing their personal information—specifically, name, age, and gender—over time.

## Features
- Conversational AI powered by OpenAI Chat API
- User info (name, age, gender) extraction & storage via Supabase
- Persistent user ID using `localStorage`
- Typing animation and paginated chat history
- Modern React UI with Tailwind CSS
- Supabase Edge Functions for backend logic

## Setup Instructions

1. Clone repository: https://github.com/chandan-m/MemoryDrivenChatbot.git
2. Update API keys and URLs in the .env files (See next section)
3. Start Backend
    - `cd supabase`
    - Local:
      ```
      supabase start
      supabase migration up
      supabase functions serve chat (Optional: To see logs in terminal)
      ```
      To seed data:
      ```
      supabase db reset
      supabase db seed --file ./supabase/seed.sql
      ```
    - Deployment:
      ```
      supabase secrets set --env-file ./supabase/functions/.env
      supabase functions deploy chat
      ```
4. Start Frontend (local)
   ```
   cd frontend
   npm install
   npm run dev
   ```
   
## Env Files
Frontend:

frontend/.env
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon-key>
```
frontend/.env.production
```
VITE_SUPABASE_URL=<supabase-domain>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Backend:

supabase/functions/.env
```
OPENAI_API_KEY=<api-key>
```

## Model Configuration (Optional)
Update the following model parameters (if required) in `supabase/functions/chat/constants.ts`:\
Defaults:
- GPT_MODEL - `gpt-4o-mini`
- GPT_MODEL_BEHAVIOUR - Prompt to set the behaviour of the AI assistant - `You are a helpful assistant that chats naturally with users`
- MAX_CHAT_HISTORY_CONTEXT - # of past messages sent as context to the model - ``

## Architecture:
### Message Flow (High-Level)

```
[React Frontend]
   ↓ (user message)
[Supabase Edge Function (sendMessage)]
   ├─ If new user, create user record with UUID
   ├─ If `extractUserInfo` flag is true:
   │    └─ Calls OpenAI Function Tool:
   │        "Extract name, age, gender from previous messages"
   │    └─ Updates user with extracted info
   └─ Sends prompt + chat history to OpenAI
      ├─ Store message in DB
      └─ Stores response
   ↓
[Frontend receives reply + updates UI]
```

### Info Extraction Logic
1. Function Tool JSON Schema:
```
{
  name: "extract_user_info",
  description: "Extract name, age, and gender of the user from the chat history",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", nullable: true },
      age: { type: "integer", nullable: true },
      gender: { type: "string", enum: ["Male", "Female", "Other"], nullable: true }
    }
  }
}
```
2. If extractUserInfo flag is passed:
   - The last 5–10 messages are sent to OpenAI with this tool.
   - The returned values are stored via Supabase updateUser() function.
   - Missing fields are set as null.

### Detailed Backend Flow

#### `sendMessage(user_id, message)`

1. **Get or Create User**
    - Calls `getOrCreateUser(user_id)` from `dataAccess`.
    - If the user ID doesn't exist in DB, creates a new user with a constant UUID (during testing or first use).

2. **Fetch Recent Chat History**
    - Loads the most recent messages using `fetchMessages(user_id, limit)` for conversational context.

3. **Determine if Info Extraction is Needed**
    - Runs `hasAllUserInfo(user)` to check if name, age, gender are already known.
    - If not, sets a flag: `extractUserInfo = true`.

4. **Call `chatCompletionHelper()`**
    - Constructs a message sequence:
      ```ts
      [
        { role: "system", content: GPT_MODEL_BEHAVIOUR },
        ...chatHistory,
        { role: "user", content: message }
      ]
      ```
    - If `extractUserInfo` is true:
        - Includes `tools` metadata and `tool_choice: "auto"` to allow OpenAI to call a function tool.
        - If a function call to `extract_user_info` is made, it parses arguments to extract:
            - `name?: string`
            - `age?: number`
            - `gender?: string`
        - If no assistant message is returned, a **second call** is made without tools to generate the reply.

5. **Update User Info**
    - If new user fields are detected and non-null, updates the DB via `updateUser(user_id, userInfo)`.

6. **Save Messages**
    - Uses `saveMessages()` to insert both user and assistant messages into Supabase, with timestamps:
      ```ts
      [
        { user_id, role: "user", content: message },
        { user_id, role: "assistant", content: reply }
      ]
      ```

7. **Send Response**
    - Returns:
      ```ts
      {
        user_id,
        reply: <assistant’s reply>,
        savedMessages: [userMessage, assistantReply]
      }
      ```
