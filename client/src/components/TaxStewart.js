import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { inputChecker } from "../utils/inputChecker";
import leadContext from "../context/leadContext";
import { trackCustomEvent, trackStandardEvent } from "../utils/fbq"; // adjust path as needed

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const PHASE = {
  INTAKE_ISSUES: "intake_issues",
  INTAKE_QUESTIONS: "intake_questions",
  QUESTION: "question",
  NAME: "name",
  CONTACT_OFFER: "contact_offer",
  CONTACT_DETAILS: "contact_details",
  VERIFICATION: "verification",
  DONE: "done",
};

const STATE_LABELS = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const STATES = Object.keys(STATE_LABELS);

const ISSUE_OPTIONS = [
  { id: "balance_due", label: "I owe taxes" },
  { id: "irs_notice", label: "I got an IRS notice" },
  { id: "unfiled", label: "Unfiled returns" },
  { id: "levy_lien", label: "Levy/Lien" },
  { id: "audit", label: "Audit/Exam" },
];

const INTAKE_STEPS = [
  {
    key: "balanceBand",
    prompt: "About how much do you owe?",
    options: [
      { id: "lt10k", label: "Under $10k" },
      { id: "10to50k", label: "$10k–$50k" },
      { id: "gt50k", label: "Over $50k" },
      { id: "unsure", label: "Not sure" },
    ],
    showIf: (form) => form.issues?.includes("balance_due"),
  },
  {
    key: "noticeType",
    prompt: "What type of notice do you have?",
    options: [
      { id: "none", label: "No notice" },
      { id: "cp504", label: "CP504" },
      { id: "levy", label: "Levy / Final notice" },
      { id: "other", label: "Something else" },
    ],
    showIf: (form) =>
      form.issues?.includes("irs_notice") || form.issues?.includes("levy_lien"),
  },
  {
    key: "taxScope",
    prompt: "Is this a federal or state tax issue?",
    options: [
      { id: "federal", label: "Federal (IRS)" },
      { id: "state", label: "State" },
      { id: "both", label: "Both" },
    ],
    showIf: () => true,
  },
  {
    key: "state",
    prompt: "Which state?",
    type: "select",
    options: STATES.map((code) => ({ id: code, label: STATE_LABELS[code] })),
    showIf: (form) => form.taxScope === "state" || form.taxScope === "both",
  },
  {
    key: "filerType",
    prompt: "Is this for an individual or a business?",
    options: [
      { id: "individual", label: "Individual" },
      { id: "business", label: "Business" },
    ],
    showIf: () => true,
  },
];

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

let msgId = 0;
const genId = () => `msg-${++msgId}`;

function renderMessage(m) {
  // Simple HTML rendering for messages
  return { __html: m.text };
}

function humanSummary(form = {}) {
  const scopeText =
    form.taxScope === "both"
      ? `the IRS and your state${
          form.state ? ` (${STATE_LABELS[form.state]})` : ""
        }`
      : form.taxScope === "state"
      ? `your state${form.state ? ` (${STATE_LABELS[form.state]})` : ""}`
      : "the IRS";

  const whoText =
    form.filerType === "business"
      ? "your business taxes"
      : "your personal income tax";

  const amountMap = {
    lt10k: "under $10k",
    "10to50k": "$10k–$50k",
    gt50k: "over $50k",
    unsure: "an amount you're not sure about",
  };
  const amountText = form.balanceBand ? amountMap[form.balanceBand] : null;

  const issues = new Set(form.issues || []);
  const parts = [];
  if (issues.has("balance_due")) parts.push("a balance due");
  if (issues.has("irs_notice")) parts.push("an IRS notice");
  if (issues.has("unfiled")) parts.push("unfiled returns");
  if (issues.has("levy_lien")) parts.push("a levy or lien");
  if (issues.has("audit")) parts.push("an audit/exam");
  const issuePhrase = parts.length ? parts.join(" and ") : "a tax matter";

  const noticeDetail =
    form.noticeType && form.noticeType !== "none"
      ? ` (notice: ${
          form.noticeType === "cp504"
            ? "CP504"
            : form.noticeType === "levy"
            ? "Levy / Final notice"
            : form.noticeType === "other"
            ? "Something else"
            : "No notice"
        })`
      : "";

  const amountClause = amountText ? ` of ${amountText}` : "";
  return `Based on what you selected, you're dealing with ${issuePhrase}${amountClause} with ${scopeText} for ${whoText}${noticeDetail}.`;
}

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function TaxStewart() {
  // ========================== CONTEXT ==========================
  const { askTaxQuestion, sendQuestion } = useContext(leadContext);

  // ========================== STATE ==========================
  const [phase, setPhase] = useState(PHASE.INTAKE_ISSUES);
  const [messages, setMessages] = useState([
    {
      id: genId(),
      who: "stew",
      text: "Hi! I'm Stewart, your tax guide. Let's figure out your tax situation. What are your current tax problems? Select all that apply.",
    },
    {
      id: genId(),
      who: "stew",
      type: "intake_issues",
      text: "",
    },
  ]);
  const [form, setForm] = useState({
    name: "",
    // Intake fields
    issues: [],
    balanceBand: "",
    noticeType: "",
    taxScope: "",
    state: "",
    filerType: "",
    // Question
    question: "",
    answer: "",
    // Contact
    contactPref: "", // "email", "phone", or "both"
    email: "",
    phone: "",
    // Verification
    emailCode: "",
    phoneCode: "",
    emailVerified: false,
    phoneVerified: false,
  });
  const [input, setInput] = useState("");
  const [inputErr, setInputErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentIntakeStep, setCurrentIntakeStep] = useState(0);

  // ========================== REFS ==========================
  const bottomRef = useRef(null);

  // Get active intake steps based on current form state
  const activeIntakeSteps = useMemo(() => {
    return INTAKE_STEPS.filter((step) => !step.showIf || step.showIf(form));
  }, [form]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ========================== PHASE HANDLERS ==========================

  // NAME phase
  function handleNameSubmit(name) {
    // ⭐ Pixel: user provided their name (major intent checkpoint)
    trackCustomEvent("StewNameSubmitted", {
      name_length: name.length,
      has_spaces: name.includes(" "),
    });

    trackStandardEvent("Contact");
    setForm((prev) => ({ ...prev, name }));
    setMessages((prev) => [
      ...prev,
      { id: genId(), who: "you", text: name },
      {
        id: genId(),
        who: "stew",
        text: `Nice to meet you, ${name}! Would you like us to reach out via email, phone, or both?`,
      },
      {
        id: genId(),
        who: "stew",
        type: "contact_buttons",
        text: "",
      },
    ]);
    setPhase(PHASE.CONTACT_OFFER);
  }

  // INTAKE_ISSUES phase - handle issue selection
  function handleIssueToggle(issueId) {
    setForm((prev) => {
      const currentIssues = prev.issues || [];
      const newIssues = currentIssues.includes(issueId)
        ? currentIssues.filter((id) => id !== issueId)
        : [...currentIssues, issueId];
      return { ...prev, issues: newIssues };
    });
  }

  function handleIssuesContinue() {
    if (!form.issues?.length) {
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: "Please select at least one issue to continue.",
        },
      ]);
      return;
    }

    // Start intake questions
    setMessages((prev) => [
      ...prev,
      {
        id: genId(),
        who: "stew",
        text: "Got it. Let's go step by step.",
      },
    ]);

    setCurrentIntakeStep(0);
    setPhase(PHASE.INTAKE_QUESTIONS);

    // Add first question
    const firstStep = activeIntakeSteps[0];
    if (firstStep) {
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: firstStep.prompt,
        },
        {
          id: genId(),
          who: "stew",
          type: "intake_step",
          stepIndex: 0,
          text: "",
        },
      ]);
    } else {
      // No follow-up questions, finish intake
      finishIntake();
    }
  }

  // INTAKE_QUESTIONS phase - handle step answers
  function handleIntakeStepAnswer(stepKey, value, label) {
    setForm((prev) => ({ ...prev, [stepKey]: value }));

    // Show user's selection as a message
    setMessages((prev) => [...prev, { id: genId(), who: "you", text: label }]);

    // Move to next step or finish
    const nextStepIndex = currentIntakeStep + 1;

    // Wait a moment, then check for next step (after form updates)
    setTimeout(() => {
      const nextActiveSteps = INTAKE_STEPS.filter(
        (step) => !step.showIf || step.showIf({ ...form, [stepKey]: value })
      );

      if (nextStepIndex < nextActiveSteps.length) {
        const nextStep = nextActiveSteps[nextStepIndex];
        setCurrentIntakeStep(nextStepIndex);
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            who: "stew",
            text: nextStep.prompt,
          },
          {
            id: genId(),
            who: "stew",
            type: "intake_step",
            stepIndex: nextStepIndex,
            text: "",
          },
        ]);
      } else {
        finishIntake();
      }
    }, 100);
  }

  function finishIntake() {
    const summary = humanSummary(form);

    // ⭐ Pixel: User completed intake buttons (issues, balance, notice type, etc.)
    trackCustomEvent("StewIntakeCompleted", {
      balance_band: form.balanceBand || null,
      notice_type: form.noticeType || null,
      filer_type: form.filerType || null,
      tax_scope: form.taxScope || null,
      state: form.state || null,
      issues_count: form.issues?.length || 0,
    });

    trackStandardEvent("CompleteRegistration");

    setMessages((prev) => [
      ...prev,
      {
        id: genId(),
        who: "stew",
        text: `${summary}<br/><br/>Now, what specific question can I help you with?`,
      },
    ]);
    setPhase(PHASE.QUESTION);
  }

  // QUESTION phase - get AI answer, then ask for name
  async function handleQuestionSubmit(question) {
    setForm((prev) => ({ ...prev, question }));
    setMessages((prev) => [
      ...prev,
      { id: genId(), who: "you", text: question },
    ]);
    setLoading(true);

    try {
      const result = await askTaxQuestion(question);

      if (!result.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            who: "stew",
            text:
              result.error ||
              "Sorry, I encountered an error. Please try again.",
          },
        ]);
        setLoading(false);
        return;
      }

      const answer = result.answer || "";

      // ⭐ Pixel event: they submitted a real question + received an answer
      trackCustomEvent("StewQuestionSubmitted", {
        question_length: question.length,
        has_ai_answer: !!answer,
      });

      trackStandardEvent("SubmitApplication");

      setForm((prev) => ({ ...prev, answer }));
      setMessages((prev) => [
        ...prev,
        { id: genId(), who: "stew", text: answer },
        {
          id: genId(),
          who: "stew",
          text: `I'd like to continue helping you with this matter. We can send you a detailed guide about your situation and how Wynn Tax can help. First, what's your name?`,
        },
      ]);
      setPhase(PHASE.NAME);
    } catch (error) {
      console.error("Error in handleQuestionSubmit:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // CONTACT_OFFER phase - user clicks Email/Phone/Both buttons
  function handleContactPrefSelect(pref) {
    setForm((prev) => ({ ...prev, contactPref: pref }));
    setMessages((prev) => [
      ...prev,
      {
        id: genId(),
        who: "you",
        text: pref === "both" ? "Both please" : `Via ${pref}`,
      },
      {
        id: genId(),
        who: "stew",
        text:
          pref === "email"
            ? "Great! What's your email address?"
            : pref === "phone"
            ? "Perfect! What's your cell number?"
            : "Wonderful! Let's start with your email address.",
      },
    ]);
    setPhase(PHASE.CONTACT_DETAILS);
  }

  // CONTACT_DETAILS phase - collect email and/or phone, then send verification codes
  async function handleContactDetailsSubmit(value) {
    const { contactPref } = form;

    if (contactPref === "email") {
      const updatedForm = { ...form, email: value };
      setForm(updatedForm);
      setMessages((prev) => [
        ...prev,
        { id: genId(), who: "you", text: value },
        {
          id: genId(),
          who: "stew",
          text: "Perfect! I'm sending a verification code to your email. Please check your inbox.",
        },
      ]);

      // ⭐ Pixel: user provided an email (email-only flow)

      trackStandardEvent("InitiateCheckout");
      // Send verification code
      await sendVerificationCodes(updatedForm);
      return;
    }

    if (contactPref === "phone") {
      const updatedForm = { ...form, phone: value };
      setForm(updatedForm);
      setMessages((prev) => [
        ...prev,
        { id: genId(), who: "you", text: value },
        {
          id: genId(),
          who: "stew",
          text: "Great! I'm sending a verification code to your phone. Please check your messages.",
        },
      ]);

      // ⭐ Pixel: user provided a phone (phone-only flow)
      trackCustomEvent("StewContactProvided", {
        contact_pref: "phone",
        method: "phone",
        has_email: false,
        has_phone: true,
      });
      trackStandardEvent("AddPaymentInfo");
      // Send verification code
      await sendVerificationCodes(updatedForm);
      return;
    }

    if (contactPref === "both") {
      // Collect email first, then phone
      if (!form.email) {
        setForm((prev) => ({ ...prev, email: value }));
        setMessages((prev) => [
          ...prev,
          { id: genId(), who: "you", text: value },
          { id: genId(), who: "stew", text: "Great! Now your cell number?" },
        ]);

        // ⭐ Pixel: first step of "both" flow – email captured
        trackCustomEvent("StewContactProvided", {
          contact_pref: "both",
          method: "email",
          step: "email_first",
          has_email: true,
          has_phone: false,
        });
        trackStandardEvent("AddPaymentInfo");
        return;
      }

      if (!form.phone) {
        const updatedForm = { ...form, phone: value };
        setForm(updatedForm);
        setMessages((prev) => [
          ...prev,
          { id: genId(), who: "you", text: value },
          {
            id: genId(),
            who: "stew",
            text: "Excellent! I'm sending verification codes to both your email and phone. Please check both.",
          },
        ]);

        // ⭐ Pixel: second step of "both" flow – phone captured, now have both
        trackCustomEvent("StewContactProvided", {
          contact_pref: "both",
          method: "both",
          step: "phone_second",
          has_email: true,
          has_phone: true,
        });
        trackStandardEvent("AddPaymentInfo");
        // Send verification codes
        await sendVerificationCodes(updatedForm);
        return;
      }
    }
  }

  // Send verification codes via backend
  async function sendVerificationCodes(currentForm) {
    try {
      const response = await fetch("/api/send-verification-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: currentForm.name,
          email: currentForm.email,
          phone: currentForm.phone,
          contactPref: currentForm.contactPref,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            who: "stew",
            text: "Sorry, there was an error sending the verification codes. Please try again.",
          },
        ]);
        return;
      }

      // Move to verification phase
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: "Please enter the verification code(s) you received.",
        },
      ]);
      setPhase(PHASE.VERIFICATION);
    } catch (error) {
      console.error("Error sending verification codes:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: "Sorry, there was an error. Please try again.",
        },
      ]);
    }
  }

  // VERIFICATION phase - verify codes and finalize
  async function handleVerificationSubmit() {
    try {
      const response = await fetch("/api/verify-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
          emailCode: form.emailCode,
          phoneCode: form.phoneCode,
          contactPref: form.contactPref,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            who: "stew",
            text:
              result.error || "Invalid verification code. Please try again.",
          },
        ]);
        return false;
      }

      // ⭐ Pixel: codes verified successfully
      trackCustomEvent("StewContactVerified", {
        contact_pref: form.contactPref,
        verified_email: !!form.email,
        verified_phone: !!form.phone,
      });
      trackStandardEvent("Subscribe");
      // Codes verified! Now finalize submission
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: "Verified! Preparing your personalized tax guide...",
        },
      ]);

      await finalizeSubmission();
      return true;
    } catch (error) {
      console.error("Error verifying codes:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: "Sorry, there was an error. Please try again.",
        },
      ]);
      return false;
    }
  }

  // Finalize submission - generate PDF and send follow-up
  async function finalizeSubmission() {
    try {
      const summary = humanSummary(form);

      const response = await fetch("/api/finalize-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          contactPref: form.contactPref,
          question: form.question,
          answer: form.answer,
          issues: form.issues,
          balanceBand: form.balanceBand,
          noticeType: form.noticeType,
          taxScope: form.taxScope,
          state: form.state,
          filerType: form.filerType,
          intakeSummary: summary,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            who: "stew",
            text: "There was an issue finalizing your submission. Our team has been notified and will reach out soon.",
          },
        ]);
        setPhase(PHASE.DONE);
        return;
      }

      // ⭐ Pixel: full Stewart submission completed
      trackCustomEvent("StewSubmissionComplete", {
        contact_pref: form.contactPref,
        has_email: !!form.email,
        has_phone: !!form.phone,
        balance_band: form.balanceBand || null,
        notice_type: form.noticeType || null,
        tax_scope: form.taxScope || null,
      });

      // ⭐ (Optional) also mark this as a standard Lead for FB optimization
      trackStandardEvent("Lead", {
        source: "Stewart",
        content_name: "Stewart Submission Complete",
      });

      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: `Perfect! I've sent your personalized tax guide to ${
            form.email ? "your email" : ""
          }${form.email && form.phone ? " and a " : ""}${
            form.phone ? "scheduling link to your phone" : ""
          }. Our team will reach out within 24 hours. Thank you for choosing Wynn Tax Solutions!`,
        },
      ]);
      setPhase(PHASE.DONE);
    } catch (error) {
      console.error("Error finalizing submission:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          who: "stew",
          text: "There was an issue, but our team has your information and will reach out soon.",
        },
      ]);
      setPhase(PHASE.DONE);
    }
  }

  // ========================== INPUT HANDLING ==========================

  function handleInputChange(e) {
    const raw = e.target.value;
    setInput(raw);

    // Determine validation phase
    let validationPhase = phase;
    if (phase === PHASE.CONTACT_DETAILS) {
      if (form.contactPref === "phone") validationPhase = "phone";
      else if (form.contactPref === "email" || !form.email)
        validationPhase = "email";
      else validationPhase = "phone"; // second step of "both"
    }

    // Only validate text input phases
    const textPhases = [PHASE.NAME, PHASE.QUESTION, "email", "phone"];
    if (!textPhases.includes(validationPhase)) {
      setInputErr(null);
      return;
    }

    const result = inputChecker({ phase: validationPhase, value: raw });

    if (result.ok) {
      setInputErr(null);
    } else {
      const errorMessages = {
        empty_name: "Please enter your name.",
        empty_email: "Please enter your email.",
        empty_phone: "Please enter your phone number.",
        empty_question: "Please enter a question.",
        invalid_name_format:
          "Name should only contain letters, spaces, hyphens, and apostrophes.",
        invalid_email: "Please enter a valid email address.",
        invalid_phone: "Please enter a valid phone number (10-15 digits).",
        gibberish_name: "Please enter a real name.",
        gibberish_question: "Please enter a clear question.",
        too_short: "Question is too short. Please be more specific.",
        profanity_detected: "Please keep it respectful.",
      };
      setInputErr(errorMessages[result.reason] || "Please check your input.");
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (phase === PHASE.DONE) return;

    const val = input.trim();

    // INTAKE phases use buttons, not text input
    if (phase === PHASE.INTAKE_ISSUES) {
      handleIssuesContinue();
      return;
    }

    if (phase === PHASE.INTAKE_QUESTIONS) {
      // Handled by buttons in the message
      return;
    }

    // CONTACT_OFFER phase uses buttons, not text input
    if (phase === PHASE.CONTACT_OFFER) return;

    // VERIFICATION phase uses special handler
    if (phase === PHASE.VERIFICATION) {
      handleVerificationSubmit();
      return;
    }

    // For text input phases, validate before proceeding
    if (!val) {
      setInputErr("Please enter something.");
      return;
    }

    // Determine validation phase
    let validationPhase = phase;
    if (phase === PHASE.CONTACT_DETAILS) {
      if (form.contactPref === "phone") validationPhase = "phone";
      else if (form.contactPref === "email" || !form.email)
        validationPhase = "email";
      else validationPhase = "phone";
    }

    const result = inputChecker({ phase: validationPhase, value: val });

    if (!result.ok) {
      // Error already set by handleInputChange
      return;
    }

    // Clear input
    setInput("");
    setInputErr(null);

    // Route to appropriate handler
    if (phase === PHASE.NAME) {
      handleNameSubmit(result.cleaned);
    } else if (phase === PHASE.QUESTION) {
      handleQuestionSubmit(result.cleaned);
    } else if (phase === PHASE.CONTACT_DETAILS) {
      handleContactDetailsSubmit(result.cleaned);
    }
  }

  // ========================== RENDER ==========================

  const isInputDisabled =
    phase === PHASE.INTAKE_ISSUES ||
    phase === PHASE.INTAKE_QUESTIONS ||
    phase === PHASE.CONTACT_OFFER ||
    phase === PHASE.VERIFICATION || // Disabled during verification (uses special UI)
    phase === PHASE.DONE ||
    loading;

  const buttonLabel =
    phase === PHASE.INTAKE_ISSUES
      ? "Continue"
      : phase === PHASE.INTAKE_QUESTIONS
      ? "Continue"
      : phase === PHASE.VERIFICATION
      ? "Verify"
      : phase === PHASE.NAME || phase === PHASE.CONTACT_DETAILS
      ? "Send"
      : phase === PHASE.QUESTION
      ? "Send"
      : "Continue";

  const placeholder =
    phase === PHASE.QUESTION
      ? "Type your question…"
      : phase === PHASE.NAME
      ? "Enter your name…"
      : phase === PHASE.CONTACT_DETAILS
      ? form.contactPref === "phone" ||
        (form.contactPref === "both" && form.email)
        ? "Your cell number…"
        : "Your email address…"
      : "";

  return (
    <div style={styles.shell}>
      {/* Chat messages */}
      <div style={styles.chatContainer}>
        <div style={styles.chat}>
          {/* Message transcript with embedded intake UI */}
          {messages.map((m) => {
            // Regular message
            if (
              m.type !== "intake_issues" &&
              m.type !== "intake_step" &&
              m.type !== "contact_buttons"
            ) {
              return (
                <div
                  key={m.id}
                  style={{
                    ...styles.msg,
                    ...(m.who === "you" ? styles.user : styles.bot),
                  }}
                >
                  <div style={styles.role}>
                    {m.who === "you" ? "You" : "Tax Stewart"}
                  </div>
                  <div
                    style={styles.bubble}
                    dangerouslySetInnerHTML={renderMessage(m)}
                  />
                </div>
              );
            }

            // Intake issues selection
            if (m.type === "intake_issues") {
              return (
                <div key={m.id} style={styles.optionsContainer}>
                  <div style={styles.optionsGrid}>
                    {ISSUE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleIssueToggle(opt.id)}
                        style={{
                          ...styles.optionBtn,
                          ...(form.issues?.includes(opt.id)
                            ? styles.optionBtnSelected
                            : {}),
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // Intake step (follow-up questions)
            if (m.type === "intake_step") {
              const step = activeIntakeSteps[m.stepIndex];
              if (!step) return null;

              return (
                <div key={m.id} style={styles.optionsContainer}>
                  <div style={styles.optionsGrid}>
                    {step.type === "select" ? (
                      <select
                        value={form[step.key] || ""}
                        onChange={(e) => {
                          const selectedOption = step.options.find(
                            (opt) => opt.id === e.target.value
                          );
                          if (selectedOption) {
                            handleIntakeStepAnswer(
                              step.key,
                              e.target.value,
                              selectedOption.label
                            );
                          }
                        }}
                        style={styles.select}
                      >
                        <option value="">-- Select --</option>
                        {step.options.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      step.options?.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() =>
                            handleIntakeStepAnswer(step.key, opt.id, opt.label)
                          }
                          style={{
                            ...styles.optionBtn,
                            ...(form[step.key] === opt.id
                              ? styles.optionBtnSelected
                              : {}),
                          }}
                        >
                          {opt.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            }

            // Contact preference buttons
            if (m.type === "contact_buttons") {
              return (
                <div key={m.id} style={styles.contactButtons}>
                  <button
                    onClick={() => handleContactPrefSelect("email")}
                    style={styles.contactBtn}
                  >
                    📧 Email
                  </button>
                  <button
                    onClick={() => handleContactPrefSelect("phone")}
                    style={styles.contactBtn}
                  >
                    📱 Phone
                  </button>
                  <button
                    onClick={() => handleContactPrefSelect("both")}
                    style={styles.contactBtn}
                  >
                    📧📱 Both
                  </button>
                </div>
              );
            }

            return null;
          })}

          {/* Verification code inputs */}
          {phase === PHASE.VERIFICATION && (
            <div style={styles.verificationContainer}>
              {(form.contactPref === "email" ||
                form.contactPref === "both") && (
                <div style={styles.verificationField}>
                  <label style={styles.verificationLabel}>Email Code:</label>
                  <input
                    type="text"
                    value={form.emailCode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        emailCode: e.target.value,
                      }))
                    }
                    placeholder="6-digit code"
                    maxLength={6}
                    style={styles.verificationInput}
                  />
                </div>
              )}
              {(form.contactPref === "phone" ||
                form.contactPref === "both") && (
                <div style={styles.verificationField}>
                  <label style={styles.verificationLabel}>Phone Code:</label>
                  <input
                    type="text"
                    value={form.phoneCode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneCode: e.target.value,
                      }))
                    }
                    placeholder="6-digit code"
                    maxLength={6}
                    style={styles.verificationInput}
                  />
                </div>
              )}
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div style={{ ...styles.msg, ...styles.bot }}>
              <div style={styles.role}>Tax Stewart</div>
              <div style={styles.bubble}>Thinking…</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div style={styles.inputArea}>
        {inputErr && <div style={styles.error}>{inputErr}</div>}
        <form onSubmit={handleSend} style={styles.inputRow}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isInputDisabled}
            style={styles.input}
            autoFocus={false}
          />
          <button
            type="submit"
            disabled={phase === PHASE.DONE}
            style={{
              ...styles.button,
              ...(phase === PHASE.DONE ? styles.buttonDisabled : {}),
            }}
          >
            {buttonLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = {
  shell: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    fontFamily: "system-ui, sans-serif",
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: "16px",
  },
  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
    scrollbarGutter: "stable",
  },
  msg: {
    display: "flex",
    flexDirection: "column",
  },
  user: {
    alignItems: "flex-end",
  },
  bot: {
    alignItems: "flex-start",
  },
  role: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: 500,
  },
  bubble: {
    maxWidth: "85%",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "12px 16px",
    lineHeight: 1.5,
    fontSize: 15,
    color: "#0f172a",
  },
  contactButtons: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    margin: "12px 0",
  },
  contactBtn: {
    background: "#f8fafc",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  optionsContainer: {
    margin: "8px 0",
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 8,
  },
  optionBtn: {
    background: "#fff",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center",
  },
  optionBtnSelected: {
    background:
      "linear-gradient(135deg, #f97316 0%, #ec4899 40%, #8b5cf6 100%)",
    color: "#fff",
    borderColor: "transparent",
  },
  select: {
    gridColumn: "1 / -1",
    padding: "12px 16px",
    fontSize: 15,
    borderRadius: 8,
    border: "2px solid #e2e8f0",
    outline: "none",
    cursor: "pointer",
  },
  inputArea: {
    padding: "12px 16px",
    borderTop: "1px solid #e2e8f0",
    background: "#fff",
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: 500,
  },
  inputRow: {
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  button: {
    background:
      "linear-gradient(135deg, #f97316 0%, #ec4899 40%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    whiteSpace: "nowrap",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  verificationContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "16px",
    background: "#f8fafc",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    margin: "8px 0",
  },
  verificationField: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  verificationLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
  },
  verificationInput: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "2px solid #cbd5e1",
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "4px",
    textAlign: "center",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
};
