# Safe Development Rules for Milkman Dairy

## STRICT RULE 0: NO DIRECT CODING — REPORT & APPROVAL FIRST PROTOCOL
- NEVER modify or edit files directly when the user requests a change or reports a problem.
- ALWAYS provide a 4-step report first:
  1. User Needs List
  2. Proposed Changes & Impacted Files
  3. Pros & Cons (Fayde aur Nuksan)
  4. Mandatory Question: "Kya main ye changes shuru kar doon?"
- Wait for user confirmation before editing any files.

## Rule 1: Zero Regression
- NEVER touch or rewrite working core systems (Auth, WhatsApp OTP, Session, Checkout, DB sync).

## Rule 2: Modular Architecture
- Separate concerns into isolated files (`auth.js`, `products.js`, `slider.js`, `main.js`).

## Rule 3: Syntax Verification
- Run `node --check` on any updated JS file.

## Rule 4: Preserve Contracts
- Never alter existing IDs or Hash routing rules (`#login`, `#cart`).

## Rule 5: Keep Website & Public in Parity
- Mirror all frontend changes across both directories.
