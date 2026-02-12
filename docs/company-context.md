# Company context (optional)

The chat can use **company-specific information** (name, products, services, FAQ, policies) to answer questions precisely. This feature is **disabled by default**: the app works as usual until you enable it.

## How it works

- You put your company information in a **text or Markdown file** (e.g. `knowledge/company.md`).
- You set the path to that file in `.env` with **`COMPANY_KNOWLEDGE_PATH`**.
- On startup, the server reads the file and injects its content into the **system prompt**. The AI is instructed to use only that information for company-related questions and not to invent details.

If `COMPANY_KNOWLEDGE_PATH` is unset or empty, or the file is missing, the feature is off and the chat behaves as before.

## How to enable it

### 1. Create your knowledge file

Copy the example and edit it with your real data:

```bash
cp knowledge/company.example.md knowledge/company.md
```

Edit `knowledge/company.md` with your company name, services, FAQ, contact details, etc. Use plain text or Markdown. The file is in `.gitignore` as `knowledge/company.md`, so it will not be committed (keep the example file in the repo for reference).

### 2. Set the path in `.env`

Add or uncomment:

```env
COMPANY_KNOWLEDGE_PATH=knowledge/company.md
```

The path is relative to the **project root** (where `package.json` is). You can use another path or filename if you prefer.

### 3. Restart the server

Restart the backend so it loads the file (e.g. stop `npm run dev` with `Ctrl+C`, then run `npm run dev` again).

### 4. Verify

Open [http://localhost:3001/health](http://localhost:3001/health). The response should include `"companyContext": true` when the file was loaded successfully.

## Format of the knowledge file

- Use **Markdown** or plain text.
- Structure with headings (e.g. `## About us`, `## FAQ`) so the model can use sections effectively.
- Include only information you want the bot to use. The AI is told not to invent anything not in the file.
- Keep the total size reasonable: the entire file is sent in every request. For very large documentation (many pages), consider a RAG-style approach in the future (retrieval over documents).

## Limitations

- **Context length:** The full file is added to the system prompt. Very long files may hit the model’s context limit or increase latency and cost.
- **Updates:** Changes to the knowledge file require a **server restart** to take effect.
- **Language:** The system prompt still asks the AI to reply in English unless the user requests another language; your company content can be in any language.

## Disabling again

To turn the feature off:

- Remove or comment out `COMPANY_KNOWLEDGE_PATH` in `.env`, or
- Set it to an empty value.

Then restart the server. The chat will behave as it did before (no company context).
