# PROJECT CODING RULES & SAFETY PROTOCOLS (Milkman Dairy)

## 🛑 STRICT RULE 0 (HIGHEST PRIORITY): NO DIRECT CODING — REPORT & APPROVAL FIRST PROTOCOL
- **NEVER modify or edit files directly** when the user reports a problem or asks for a change/feature.
- Every single time the user presents a requirement or issue, the agent MUST follow this exact 4-step protocol before touching ANY code:
  1. **Needs List (Aapki Needs):** Break down and list the user's requirements clearly in bullet points.
  2. **Proposed Changes (Kaunse Changes Honge):** Specify exactly which files, functions, or UI elements need to be changed to achieve the goal.
  3. **Pros & Cons / Impact Analysis (Fayde & Nuksan):** Clearly explain the recommended benefits, potential risks, and any trade-offs of the proposed approach.
  4. **Mandatory Confirmation Gate:** End the turn by explicitly asking: *"Kya main ye changes shuru kar doon?"* and **WAIT** for the user's explicit approval. Do NOT edit, create, or touch any files until the user gives confirmation.

## 🛡️ STRICT RULE 1: ZERO REGRESSION & DO NOT TOUCH WORKING CODE
- **NEVER** modify, refactor, or delete working core systems unless the user EXPLICITLY requests changes to that specific system.
- Specifically protected systems:
  1. **Authentication & Session** (`backend/auth.js`, frontend `auth.js`, WhatsApp OTP, Login modal, and session checks).
  2. **Product Loading & Database Sync** (`backend/server.js`, Turso DB queries, `/api/products`).
  3. **Order & Cart State** (`localStorage.milkmanCart`, checkout flows, WhatsApp notifications).
- If asked to add a new feature (such as a slider, banner, animation, or extra field), do NOT rewrite or tamper with existing functions.

## 📦 STRICT RULE 2: MODULAR ARCHITECTURE (ISOLATED FILES)
- Do NOT dump new features into a monolithic file like `main.js`.
- Respect and maintain the modular directory structure:
  - `website/js/auth.js` & `public/js/auth.js`: Handles strictly Login, Signup, OTP, Session verification, and Logout.
  - `website/js/products.js` & `public/js/products.js`: Handles strictly product catalog fetching, product cards, and Cart additions.
  - `website/js/slider.js` & `public/js/slider.js`: Handles strictly image carousel, photo gallery, and bottom sheet image switching.
  - `website/js/main.js` & `public/js/main.js`: Core orchestrator, hash routing (`#login`, `#cart`, etc.), and global popup.
- Any completely new feature must be created in its own isolated file (e.g. `reviews.js`, `referral.js`) and loaded via `<script>` tag.

## 🔍 STRICT RULE 3: SYNTAX & INTEGRITY VERIFICATION
- Before finishing any edit to a JavaScript file, **always verify syntax integrity** using `node --check <file>` or static checks.
- Never leave orphaned brackets, unclosed templates, or duplicated code blocks at the end of files.

## 🔗 STRICT RULE 4: PRESERVE DOM IDS, CLASSES & HASH ROUTES
- Never remove or change existing element IDs (such as `#authBtn`, `#authModal`, `#productsGrid`, `#cartSection`, `#customPopupOverlay`).
- Maintain existing hash routes (`#login`, `#cart`, `#plans`, `#home`, `#verify-otp`).

## 🪞 STRICT RULE 5: KEEP `website/` AND `public/` IN SYNC
- Both `website/` and `public/` directories serve frontend assets depending on hosting environment (Vercel, Node, etc.).
- When making frontend changes to HTML, CSS, or JS, always mirror the changes to both `website/` and `public/`.
