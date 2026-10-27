/* ============================================================
   Research Genius Hub: the one file you edit to change prices,
   contact details, payment details and samples.
   ============================================================ */
window.RGH = {
  businessName: "Research Genius Hub",
  email: "researchgeniushub@gmail.com",
  formSubmit: true,               // lets students attach files and send orders to your email (free FormSubmit service); set false to use email buttons only

  // UK WhatsApp number, digits only with country code, no "+" or spaces.
  // Example: "447700900123". Leave "" to hide the WhatsApp button.
  whatsapp: "",
  whatsappDisplay: "",            // e.g. "+44 7700 900123"

  // ---- Pricing (GBP) ----
  wordsPerPage: 275,
  aiRemovalRate: 7,               // per page, flat, any deadline
  // Undergraduate and Masters prices per page
  tiers: [
    { id: "urgent",  label: "Under 24 hours",        rate: 15 },
    { id: "oneday",  label: "1 to 2 days",           rate: 13 },
    { id: "standard",label: "2 to 4 days",           rate: 12 },
    { id: "relaxed", label: "5 days or more",        rate: 10 }
  ],
  // PhD-level prices per page (same deadline bands)
  tiersPhd: [
    { id: "urgent",  label: "Under 24 hours",        rate: 20 },
    { id: "oneday",  label: "1 to 2 days",           rate: 17 },
    { id: "standard",label: "2 to 4 days",           rate: 15 },
    { id: "relaxed", label: "5 days or more",        rate: 13 }
  ],
  // Approximate display rates only (1 GBP = X). The live site refreshes these automatically when it can.
  // Rates below: ECB reference rates, 23 Oct 2026. Update them now and then.
  fx: { USD: 1.3368, CAD: 1.8709, AUD: 1.9037, EUR: 1.1943, CNY: 8.917 },
  fxDate: "23 Oct 2026",

  // ---- Payments ----
  // Only methods you fill in are shown to students. Leave a field "" to hide that method.
  paypalClientId: "",             // PayPal REST app Client ID (live), for the PayPal button
  paypalMe: "",                   // or just your PayPal.me name, e.g. "ResearchGeniusHub"

  // Manual payment methods: shown with their details and the order number as the reference.
  manualPay: [
    { label: "PayPal", lines: [["PayPal email", "Muigaimoses1@live.com"]],
      note: "Send the amount shown. PayPal converts it if your account uses another currency. Choose Goods and services if asked, and put your order number in the note." },
    { label: "Mobile money (M-Pesa)", lines: [["Mobile number", "+254712117244"]],
      note: "Send from Wise or WorldRemit to this M-Pesa number, then tell us the transfer reference." }
  ],

  // Hosted payment links (card, Wise, Payoneer, Paystack, Flutterwave...).
  // In "url" you can use {amount} (e.g. 24.00), {order} (order number) and {currency}.
  payLinks: [
    { id: "card",     label: "Card",     url: "", note: "Pay by Visa or Mastercard on a secure payment page." },
    { id: "wise",     label: "Wise",     url: "", note: "Pay from your bank in GBP, USD, CAD, AUD or EUR with a low-fee transfer." },
    { id: "payoneer", label: "Payoneer", url: "", note: "Pay with Payoneer." }
  ],

  // Bank transfer details, one entry per currency. Entries with no account number or IBAN are hidden.
  banks: [
    { currency: "GBP", accountName: "", bankName: "", sortCode: "", accountNumber: "", iban: "", swift: "" },
    { currency: "USD", accountName: "", bankName: "", routing: "", accountNumber: "", swift: "" },
    { currency: "CAD", accountName: "", bankName: "", routing: "", accountNumber: "", swift: "" },
    { currency: "AUD", accountName: "", bankName: "", bsb: "", accountNumber: "" },
    { currency: "EUR", accountName: "", bankName: "", iban: "", swift: "" }
  ],

  // ---- Chat assistant ----
  // Built-in assistant answers common questions, then hands over to you. To use a live chat service instead
  // (e.g. free Tawk.to), paste its embed script address into tawkSrc and the built-in assistant switches off.
  chat: { replyWithin: "1 hour", tawkSrc: "https://embed.tawk.to/6ae057da437a3d347030a89d/default" },

  // ---- Online coaching ----
  // 1 hour = first rate. More than 1 hour = additional rate for EVERY hour (2 hours = 2 x 13).
  coaching: { first: 15, additional: 13, noticeHours: 3 },   // GBP per hour; minimum notice before the lesson

  // ---- Student reviews ----
  // Add REAL reviews only, with the student's permission. The Reviews section stays hidden while this list is empty.
  // Example: { name: "A. Student", country: "Canada", service: "Dissertation support", text: "..." }
  testimonials: [],

  // ---- Sample access ----
  samplePerPage: 2,               // GBP per page to unlock a full sample

  // ---- Accounts and file uploads ----
  // Leave blank to run in demo mode (data saved in the visitor's own browser only).
  // To go live, create a free Supabase project and paste its URL and anon key (see README.md).
  supabase: { url: "https://vgnyudtimuelfxjbcjvk.supabase.co", anonKey: "sb_publishable_-BMlXThhQ8aA3VmQBAJ1gQ_6ZmfsTLF" },

  // ---- Samples ----
  // Students read the introduction free. The full sample costs samplePerPage x pages.
  // Public files go in /samples: use ONLY the introduction file there (see tools/make_intro.py).
  // Keep the full documents private and email them after payment is confirmed.
  samples: [
    { title: "Example sample (layout only)", example: true, subject: "Business Management", level: "Undergraduate, Year 3", pages: 6, style: "Harvard",
      introFile: "",
      introText: "Remote working has moved from a niche arrangement to a mainstream way of organising work, yet the evidence on its effect on employee productivity remains mixed. Early studies reported gains in output and satisfaction (Bloom et al., 2015), while later research highlights weaker collaboration and slower innovation when teams are rarely co-located. This essay evaluates both bodies of evidence, argues that outcomes depend more on how work is managed than on where it is done, and concludes with implications for managers." },
    { title: "Argumentative essay", subject: "Sociology", level: "Undergraduate, Year 2", pages: 6,  style: "Harvard", introFile: "", introText: "" },
    { title: "Literature review",   subject: "Nursing", level: "Masters", pages: 10, style: "APA 7", introFile: "", introText: "" }
  ]
};
