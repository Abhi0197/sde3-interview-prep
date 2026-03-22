# Mock Interviews - Structured Practice for SDE 3

**Mock interviews are where preparation becomes performance.** At senior levels, the gap is rarely raw knowledge alone. It is usually clarity, prioritization, confidence under pressure, and the ability to recover when the conversation gets messy.

---

## Goals of a Good Mock Interview

A useful mock should help you improve:

- structured thinking
- executive communication
- depth without rambling
- tradeoff articulation
- calmness under interruption
- recovery after mistakes

The objective is not to "win" the mock. The objective is to expose weak spots early enough to fix them.

---

## Recommended 60-Minute Mock Format

### Part 1. Intro and Calibration - 5 minutes

- Give a concise self-introduction
- State your target role and experience level
- Ask the interviewer to simulate realistic pressure

**Good opener**:
"I’m targeting SDE 3 roles with an emphasis on backend and system design. Please interrupt me when something is unclear so I can practice handling real interview pressure."

### Part 2. Coding or DSA - 20 minutes

Evaluate:
- clarification quality
- brute force to optimized progression
- handling of edge cases
- communication during implementation

### Part 3. System Design or LLD - 20 minutes

Evaluate:
- requirement clarification
- scope control
- high-level structure
- tradeoff depth
- scaling and failure discussion

### Part 4. Behavioral - 10 minutes

Evaluate:
- ownership
- conflict handling
- influence without authority
- learning from failure

### Part 5. Feedback - 5 minutes

Keep feedback specific and evidence-based.

---

## Mock Interview Scorecard

Use a simple 1-5 rubric.

| Dimension | 1-2 | 3 | 4-5 |
|----------|-----|---|-----|
| Structure | Rambling, hard to follow | Mostly organized | Crisp, layered, easy to follow |
| Depth | Surface-level only | Good basics | Strong tradeoffs and second-order thinking |
| Communication | Jumps around, unclear | Generally understandable | Clear, concise, collaborative |
| Problem Solving | Random exploration | Reasonable path | Intentional, prioritized, adaptive |
| Recovery | Stalls after mistakes | Partial recovery | Recovers calmly and reorients fast |
| Senior Signals | Task-focused only | Some ownership themes | Strong ownership, prioritization, judgment |

---

## Coding Mock Checklist

Before coding:
- restate the problem
- confirm input constraints
- ask about expected complexity

While solving:
- start with a simple correct approach
- explain tradeoffs before optimizing
- narrate edge cases
- test with small examples out loud

After coding:
- revisit time/space complexity
- mention production considerations if relevant

**Senior-level signal**:
You should sound like someone reducing ambiguity, not someone waiting passively for permission.

---

## System Design Mock Checklist

### Step 1. Clarify the Goal

Ask:
- Who are the users?
- What is the primary workflow?
- What are the scale assumptions?
- What matters most: latency, cost, consistency, or availability?

### Step 2. Define Scope

State what you are including and excluding.

Example:
"I’ll focus on the request path, data model, caching, and failure handling. I’ll skip detailed UI and billing internals unless you want to go deeper."

### Step 3. Walk Top Down

- APIs
- major services
- data stores
- request flow
- scaling and reliability

### Step 4. Drive Tradeoffs

Good prompts:
- "Do we want stronger consistency here or better write throughput?"
- "This could be synchronous initially, but I’d move this path to async once fan-out grows."

### Step 5. Handle Pressure Gracefully

If challenged:
- acknowledge the tradeoff
- state your assumption
- adapt the design cleanly

---

## Behavioral Mock Checklist

At SDE 3, interviewers listen for:

- ownership across teams
- decision-making under ambiguity
- influencing direction
- mentoring or raising the engineering bar
- conflict resolution with maturity

Use **STAR**, but keep the emphasis on:

- scale of the problem
- choices you made
- tradeoffs considered
- concrete outcome
- what changed because of your action

---

## High-Value Behavioral Questions

Practice these until your answers feel natural:

1. Tell me about a time you led through ambiguity.
2. Describe a difficult technical disagreement and how you resolved it.
3. Tell me about a project where you improved system reliability.
4. Share a time you made a wrong technical call and what you learned.
5. Tell me about influencing stakeholders without direct authority.
6. Describe a time you raised the engineering bar for your team.
7. Explain a situation where you had to trade speed for quality or vice versa.

---

## Mock Interview Feedback Template

Use this exact structure after every session:

### What Went Well

- strongest answer or design area
- moments of clarity and confidence
- behaviors to preserve

### What Felt Weak

- unclear explanations
- rushed tradeoffs
- shallow edge-case discussion
- behavioral answers with weak outcomes

### One Change for Next Time

Pick **one** priority only.

Examples:
- "Pause for 3 seconds before answering system tradeoff questions."
- "State assumptions explicitly before drawing architecture."
- "Use stronger outcome metrics in behavioral stories."

### Next Repetition Drill

Choose one short drill:
- redo the intro
- re-answer one behavioral question
- redesign one subsystem in 5 minutes
- explain one algorithm without coding

---

## Common Mock Interview Failure Patterns

### 1. Over-Answering

Symptom:
You keep talking long after the interviewer has enough signal.

Fix:
Lead with the direct answer first. Add depth only when useful.

### 2. Under-Clarifying

Symptom:
You jump into solving without framing the problem.

Fix:
Spend the first minute aligning on assumptions and goals.

### 3. Panic After a Mistake

Symptom:
One bug or challenge causes visible loss of confidence.

Fix:
Narrate recovery:
"I think this path is getting messy. I’m going to step back, restate the invariant, and correct the approach."

### 4. Generic Behavioral Answers

Symptom:
Stories sound safe but forgettable.

Fix:
Add tension, decision points, and measurable outcomes.

---

## Solo Mocking When No Partner Is Available

You can still practice effectively:

- record yourself answering
- use a timer
- whiteboard or type while narrating
- review for filler words and unclear transitions
- score yourself using the rubric above

Good solo drills:
- 10-minute architecture explanation
- 5-minute intro
- 15-minute coding walkthrough without implementation
- STAR answer retell in under 2 minutes

---

## One-Week Mock Plan

### Day 1
- one coding mock

### Day 2
- one behavioral mock

### Day 3
- one system design mock

### Day 4
- redo the weakest section from days 1-3

### Day 5
- mixed mock with interruptions

### Day 6
- solo recording review

### Day 7
- full 60-minute simulation

---

## Interviewer Mode: How to Run a Better Mock for Someone Else

If you are helping a peer:

- interrupt like a real interviewer, but fairly
- ask follow-ups that probe tradeoffs
- avoid turning the session into coaching too early
- save detailed feedback until the end
- cite exact moments instead of giving vague advice

Bad feedback:
"Be more confident."

Good feedback:
"Your first 3 minutes of the system design answer were strong, but when I challenged consistency vs latency, you switched directions without explaining why."

---

## Final Reminder

A mock is successful if it reveals the next thing to improve.

Do enough mocks that these become automatic:

- clarify before solving
- structure before depth
- tradeoffs before certainty
- recovery before panic

That is what makes a senior candidate feel composed.
