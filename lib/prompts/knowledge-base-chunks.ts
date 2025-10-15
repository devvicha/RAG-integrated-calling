

export const KNOWLEDGE_BASE_CHUNKS_STRING = `
--- FILE: accounts/opening_workflow.md ---
id: accounts.opening_workflow
title: Account Opening — Steps & KYC Checklist
tags: [onboarding, ekyc, checklist, documents]
product_area: accounts
requires_auth: false
last_reviewed: 2025-09-04
pii: false

## Steps
1. Select account type & channel (branch / Vishwa / app).
2. Submit application & KYC (video/eKYC or in‑branch).
3. Risk & sanctions screening.
4. Activation; issue debit card/cheque book and Vishwa credentials.

## Documents
- **Individuals:** NIC/Passport, proof of address (≤3 months), photo. Income proof for credit products.
- **Businesses:** BR, TIN/VAT, board resolution (companies), signatory IDs, address proof.

--- FILE: accounts/types.md ---
id: accounts.types
title: Account Types — Features & Requirements
tags: [accounts, requirements, documents]
product_area: accounts
requires_auth: false
last_reviewed: 2025-09-04
pii: false

### Savings (Individuals)
- **Features:** interest earning, debit card, ATM/CDM, e‑statements
- **Requirements:** NIC/Passport, proof of address, initial deposit

### Current (Businesses & Professionals)
- **Features:** high transaction limits, cheque book, OD eligibility
- **Requirements:** BR/TIN/VAT (as applicable), signatory IDs, board resolution (companies)

### Fixed Deposits
- **Features:** 1–60 month tenures, auto‑renewal option
- **Requirements:** KYC; early breakage penalties may apply

### Foreign Currency Accounts
- **Features:** multi‑currency, SWIFT remittances
- **Requirements:** passport/visa, FATCA/CRS declarations when relevant

--- FILE: bank/profile.json ---
{
  "id": "bank.profile",
  "title": "Bank Profile & Contacts",
  "tags": [
    "bank",
    "contacts",
    "hours",
    "hotline"
  ],
  "product_area": "bank",
  "requires_auth": false,
  "last_reviewed": "2025-09-04",
  "pii": false,
  "bank": {
    "name": "Sampath Bank PLC",
    "country": "Sri Lanka",
    "regulator": "Central Bank of Sri Lanka",
    "hq_address": "No. 110, Sir James Peiris Mawatha, Colombo 02, Sri Lanka",
    "contacts": {
      "main_hotline_short": "1332",
      "main_hotline": "+94 11 230 3050",
      "email": "info@sampath.lk",
      "card_centre": "+94 11 230 0604"
    }
  },
  "defaults": {
    "currency": "LKR",
    "timezone": "Asia/Colombo",
    "business_hours": "Mon–Fri 09:00–17:00 (branch hours may vary)",
    "support_channels": [
      "branch",
      "phone",
      "email",
      "chat",
      "Sampath Vishwa",
      "WePay"
    ]
  }
}

--- FILE: calculators/emi.md ---
id: calculators.emi
title: EMI Calculator
tags: [calculator, emi]
product_area: loans
requires_auth: false
last_reviewed: 2025-09-04
pii: false

**Formula:** EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
- r = (annual_rate_percent / 100) / 12
- n = tenure_months

**Output:** EMI in LKR

**Disclaimer:** Illustrative; final terms per sanction & prevailing rates (AWPLR‑linked where applicable).

--- FILE: digital/channels.md ---
id: digital.channels
title: Digital Channels & Capabilities
tags: [channels, digital, app, vishwa, wepay]
product_area: channels
requires_auth: false
last_reviewed: 2025-09-04
pii: false

## Internet Banking
- **Sampath Vishwa (Retail)** — balances, intra/interbank transfers (CEFTS/SLIPS), bill payments, card controls, e‑statements, standing orders.

## Corporate Banking
- **Sampath Vishwa Corporate** — bulk payments & payroll, approvals & workflows, supplier finance.

## Mobile Apps
- **Sampath Vishwa Retail** (iOS/Android)
- **Sampath WePay (digital wallet)** — LANKAQR payments, card/account linking, P2P transfers.
- **Sampath Slip‑Less** — paperless deposit experience at branches.

--- FILE: faqs/base.md ---
id: faqs.base
title: FAQs — Quick Answers
tags: [faq, quick_answers]
product_area: generic
requires_auth: false
last_reviewed: 2025-09-04
pii: false

- **Can I open an account online?**
  Yes—use Sampath Vishwa/app for eKYC, or book a branch visit. Activation follows successful verification.

- **How do I calculate my home‑loan EMI?**
  Share the amount, rate, and tenure; I’ll compute it instantly with our EMI calculator.

- **How do I block a lost card?**
  Use the app/online to freeze or call +94 11 230 0604 (Card Centre). Replacement can be arranged to your address.

- **What are CEFTS limits?**
  Up to LKR 5,000,000 per transaction 24×7; additional bank/channel limits may apply.

- **How to receive money from abroad?**
  Use Sampath e‑Remittance for instant receipt or standard SWIFT inward remittance to your account.

--- FILE: guardrails.md ---
id: guardrails
title: Guardrails — Safety & Policy
tags: [guardrails, policy, safety]
product_area: governance
requires_auth: true
last_reviewed: 2025-09-04
pii: false

## Do Not
- Disclose internal risk thresholds.
- Promise loan approval before assessment.
- Collect full card details/CVV/passwords in chat.
- Share customer data without authentication.

## Must
- Authenticate before account‑specific actions.
- State fees/limits/TAT clearly.
- Offer accessibility/language support on request.
- Follow KYC/AML & privacy obligations at all times.

--- FILE: intents/policy.json ---
{
  "id": "intents.policy",
  "title": "Dialog Intents & Policy",
  "tags": [
    "nlu",
    "intents",
    "policy"
  ],
  "product_area": "dialog",
  "requires_auth": false,
  "last_reviewed": "2025-09-04",
  "pii": false,
  "intents": [
    {
      "name": "OpenAccount",
      "slots": [
        {
          "name": "account_type",
          "entity": "AccountType",
          "required": true
        },
        {
          "name": "channel",
          "entity": "Channel",
          "required": false
        }
      ],
      "success_reply": "To open a {account_type} account with Sampath, I can start via Sampath Vishwa/eKYC or book a branch visit. You’ll need ID and address proof. Which route suits you?",
      "policy_links": [
        "accounts.opening_workflow"
      ]
    },
    {
      "name": "LoanInquiry",
      "slots": [
        {
          "name": "loan_type",
          "entity": "LoanType",
          "required": true
        },
        {
          "name": "amount",
          "entity": "sys.number",
          "required": false
        },
        {
          "name": "tenure_months",
          "entity": "sys.number",
          "required": false
        }
      ],
      "success_reply": "For {loan_type}, I can check eligibility, list documents, and estimate EMI. Are you looking at Sevana/Dayada (housing) or Samachara (personal)?"
    },
    {
      "name": "CardBlock",
      "slots": [],
      "success_reply": "I’ll hotlist your card now. Please confirm your date of birth and approve the OTP. If you prefer, you can also call the Card Centre at +94 11 230 0604.",
      "policy_links": [
        "workflows.card_lost_block"
      ]
    },
    {
      "name": "TransferHelp",
      "slots": [
        {
          "name": "channel",
          "entity": "Channel",
          "required": false
        }
      ],
      "success_reply": "Via {channel}, you can use CEFTS for instant interbank transfers (up to LKR 5M, 24×7) or LANKAQR for merchant payments. Want step-by-step?"
    },
    {
      "name": "Complaint",
      "slots": [
        {
          "name": "category",
          "entity": "sys.any",
          "required": true
        },
        {
          "name": "summary",
          "entity": "sys.any",
          "required": true
        }
      ],
      "success_reply": "I’ve logged your complaint under '{category}'. Your ticket ID is {ticket_id}. Expected TAT is {tat}. I’ll update you and escalate if needed."
    }
  ]
}

--- FILE: loans/catalog.md ---
id: loans.catalog
title: Loan Catalog — Quick Cards
tags: [loans, product, tenure, documents]
product_area: loans
requires_auth: false
last_reviewed: 2025-09-04
pii: false

### Personal — *Sampath Samachara*
- Purpose: education, medical, home needs
- Range: up to LKR 5,000,000
- Tenure: up to 15 years
- Speed: issuance as fast as ~1 day (documents in order)

### Housing — *Sevana / Dayada*
- Sevana: tenure up to 25–30 years (policy dependent)
- Dayada: disbursement as fast as ~10 days when docs are in order; tenure up to 25 years

### Foreign‑Currency Housing
- For Sri Lankans employed abroad (solo or with spouse income)
- FCY income considered

### Vehicle Loans
- Security: hypothecation of vehicle
- Tenure: 1–7 years

### Business / SME
- Facilities: OD, term loan, invoice finance, trade services
- Docs: BR/TIN/VAT, financials, bank statements

--- FILE: loans/lifecycle.md ---
id: loans.lifecycle
title: Loan Lifecycle & Key Terms
tags: [loans, lifecycle, glossary]
product_area: loans
requires_auth: false
last_reviewed: 2025-09-04
pii: false

## Lifecycle
1. Eligibility pre‑check (income, DTI, credit history)
2. Application & KYC document submission
3. Verification (income/collateral where relevant)
4. Credit assessment & approval
5. Sanction letter & agreement
6. Disbursement (to seller/beneficiary where applicable)
7. Repayment via EMI/standing order
8. Closure & NOC issuance

## Key Terms
- **EMI** — Fixed monthly payment (principal + interest).
- **AWPLR‑link** — Some housing products reference AWPLR for rate resets.
- **LTV** — Loan‑to‑Value caps apply on secured loans.
- **Prepayment** — Allowed per product; verify lock‑in/fees.

--- FILE: payments/rails.md ---
id: payments.rails
title: Payments & Transfer Rails
tags: [payments, cefts, slips, lankaqr, swift, limits]
product_area: payments
requires_auth: false
last_reviewed: 2025-09-04
pii: false

- **LANKAQR** — Scan‑to‑pay at merchants across Sri Lanka.
- **CEFTS** — Real‑time interbank transfers **up to LKR 5,000,000**, **24×7**. Bank/channel limits may apply.
- **SLIPS** — Batch interbank transfers (T+0/T+1), common for salaries & vendors.
- **SWIFT** — Cross‑border remittances (FX conversion applies).

--- FILE: persona/nova.md ---
id: persona.nova
title: Nova Persona & Call Style
tags: [persona, tone, greeting, closing, capture_rules]
product_area: agent
requires_auth: false
last_reviewed: 2025-09-04
pii: false

# Nova — Inbound Banking Representative (Sampath Bank PLC)

**Role:** Handle customer-initiated calls with professionalism, empathy, and a natural human flow — never robotic, never scripted.

**You are not a bot**; you sound like a real banking representative.

## Core Personality
- Warm, approachable, professional, and genuinely helpful.
- Mirror caller tone (formal ↔ casual).

## Human Speech & Behavior
- Use active listening signals: “hmm… I see… right…”
- Ask **one question at a time**. Never interrupt; let the caller finish.
- If asked “are you a bot,” deflect playfully: *“Haha, no — just a person here at Sampath Bank. Now, you mentioned…”*

## Initial Response
- If the caller states their need: “Got it, thanks for sharing. Let’s go step by step.”

## Closing Flow
- Resolved: “Glad I could help with that. Is there anything else I can assist you with today?”
- Pending: “I’ll note this down and arrange a follow-up from our team. You’ll hear from us soon.”
- Out of scope: “I’ll connect you with the right team so you’re taken care of.”

## Data Capture Rules
- For any service request that requires a follow-up, ask for a **preferred contact number**.

## Safety Notes
- Use the Knowledge Base as single source of truth.
- “Figures are indicative until verified by the bank.”

--- FILE: remittances/options.md ---
id: remittances.options
title: Remittances — e‑Remittance & SWIFT
tags: [remittance, international]
product_area: remittances
requires_auth: false
last_reviewed: 2025-09-04
pii: false

- **Sampath e‑Remittance** — Instant web‑based money transfer receipts for customers and non‑customers.
- **SWIFT** — International wire transfers; FX conversion at bank rates.

--- FILE: responses/templates.md ---
id: responses.templates
title: Response Templates
tags: [templates, phrasing]
product_area: dialog
requires_auth: false
last_reviewed: 2025-09-04
pii: false

### Ask Documents (Individual)
For individuals: NIC/Passport, proof of address (last 3 months), and a photo. Income proof is required for credit products.

### Ask Documents (Business)
For businesses: BR, TIN/VAT, board resolution (companies), signatory IDs, and address proof.

### EMI Quote
For {amount} at {annual_rate_percent}% over {tenure_months} months, your estimated EMI is **{emi} LKR** *(illustrative; final per sanction & prevailing rates).*

### Fees Disclaimer
Fees and rates are indicative and subject to change per CBSL guidelines and bank policy.

### Security Warning
Never share OTPs, full card numbers, or passwords. Sampath will not request these via calls/links.

--- FILE: security_compliance.md ---
id: security.compliance
title: Security, KYC/AML, Privacy & Fraud Controls
tags: [security, compliance, aml, privacy, otp]
product_area: governance
requires_auth: true
last_reviewed: 2025-09-04
pii: false

## KYC
- Verify identity & address; periodic refresh; enhanced checks for higher‑risk profiles.

## AML & Sanctions
- Monitor unusual patterns; sanctions screening at onboarding & ongoing; report STR/SAR as required.

## Privacy & Access
- Data encryption in transit/at rest; role‑based access; consent for data sharing.

## Fraud Controls
- OTP/2FA, device binding, transaction velocity checks, card tokenization.

## Complaint Handling SLA
- Acknowledge promptly; typical resolution within **7–14 working days**; escalation path available.

--- FILE: workflows/account_opening.md ---
id: workflows.account_opening
title: Workflow — Account Opening
tags: [workflow, step_by_step, auth]
product_area: accounts
requires_auth: true
last_reviewed: 2025-09-04
pii: false

1) Capture AccountType & Channel.
2) Present document checklist (individual/business/foreign as relevant).
3) Create application & schedule eKYC or branch visit.
4) Run KYC + sanctions screening.
5) Activate & issue debit card + Vishwa credentials.

--- FILE: workflows/card_lost_block.md ---
id: workflows.card_lost_block
title: Workflow — Card Lost/Block
tags: [workflow, step_by_step, auth, card_block]
product_area: cards
requires_auth: true
last_reviewed: 2025-09-04
pii: true

1) Authenticate (DOB + OTP).
2) Hotlist immediately.
3) Offer replacement card & confirm address.
4) Review recent transactions; open disputes if needed.
5) Send confirmation SMS/email.

--- FILE: workflows/complaint_handling.md ---
id: workflows.complaint_handling
title: Workflow — Complaint Handling
tags: [workflow, step_by_step, complaints]
product_area: service
requires_auth: true
last_reviewed: 2025-09-04
pii: true

1) Acknowledge & classify.
2) Provide ticket ID & TAT.
3) Investigate; give interim updates if >3 days.
4) Resolve or escalate per matrix.
5) Collect feedback & close.

--- FILE: workflows/loan_application.md ---
id: workflows.loan_application
title: Workflow — Loan Application
tags: [workflow, step_by_step, auth]
product_area: loans
requires_auth: true
last_reviewed: 2025-09-04
pii: false

1) Capture LoanType, amount, tenure.
2) Check basic eligibility (income/DTI/score).
3) Generate product‑specific doc list (e.g., Sevana/Dayada).
4) For secured loans: valuation & legal checks.
5) Approval → sanction → e‑sign/branch sign.
6) Disburse and set EMI via standing order.
`;