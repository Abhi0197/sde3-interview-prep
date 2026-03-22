# Agentic AI Projects - Senior Interview Revision Guide

**Project discussions are where SDE 3 candidates can really stand out.** A strong answer is not "I built a chatbot." It is "I designed a system with clear goals, failure boundaries, evaluation metrics, and rollout controls."

---

## What Makes an Agent Project Interview-Worthy

A credible senior-level project usually includes:

- A real user workflow, not just a demo prompt
- Tool use or external action taking
- State or memory management
- Evaluation beyond "it looked good"
- Guardrails around risk
- Production-minded observability

When presenting a project, structure it as:

1. Problem
2. Why an agent was appropriate
3. Architecture
4. Safety and reliability controls
5. Evaluation and impact
6. Lessons learned

---

## Project Idea 1: On-Call Incident Triage Agent

### Problem

Engineers waste time correlating alerts, deploy history, logs, dashboards, and prior incidents.

### Agent Goal

When an alert fires, gather evidence, summarize likely causes, recommend next actions, and route to the correct owner.

### Core Components

- Alert ingestion service
- Context collector tools
- Incident memory store
- Hypothesis generator
- Recommendation engine
- Human approval gate for remediation

### Tools

- metrics query
- log search
- deployment history lookup
- runbook retrieval
- pager escalation

### Evaluation Metrics

- time to first useful summary
- mean time to route correctly
- false escalation rate
- human override rate
- recommendation acceptance rate

### Senior talking point

"I would keep the action-taking layer gated. The agent can recommend remediations automatically, but rollback or restart operations should require explicit approval unless the workflow is extremely low risk."

---

## Project Idea 2: PR Review Assistant for Large Repositories

### Problem

Reviewers miss cross-file risks and spend too much time on repetitive comments.

### Agent Goal

Analyze diffs, locate impacted modules, summarize risky areas, and suggest targeted review comments or test gaps.

### Architecture

1. Diff ingestion
2. Repository context fetch
3. Dependency impact analysis
4. Risk classifier
5. Suggested findings generator
6. Reviewer feedback capture

### Risks

- hallucinated file paths
- shallow understanding of business logic
- too many low-signal comments

### Guardrails

- only comment on touched files unless justified
- require evidence for each finding
- separate "high confidence finding" from "review hint"

### Interview extension

Discuss how to evaluate precision vs recall and how to avoid reviewer trust erosion.

---

## Project Idea 3: Customer Support Resolution Agent

### Goal

Handle repetitive support requests while escalating sensitive cases.

### Workflow

1. classify request
2. fetch account/context
3. retrieve policy
4. propose resolution
5. require approval for refunds, deletions, or security-sensitive actions
6. write back case summary

### Data Model

- ticket
- customer profile
- action policy
- interaction memory
- escalation state

### Metrics

- first response time
- fully resolved without escalation
- incorrect action rate
- customer satisfaction delta

### Interview insight

Show that you understand the difference between conversational fluency and operational correctness.

---

## Project Idea 4: Research and Briefing Agent for Product Leaders

### Use Case

Generate weekly market and competitor briefings from curated sources.

### Why This Is Good for Interviews

- multi-step workflow
- retrieval and synthesis
- source grounding
- scheduled execution
- measurable output quality

### Important Controls

- source allowlist
- citation requirements
- freshness windows
- deduplication across sources
- confidence labeling

---

## Project Idea 5: Interview Prep Coach

### Use Case

Personalized practice plans, mock interviews, feedback, and weak-area targeting.

### Strong Architecture

- profile and progress store
- question generator
- rubric-based evaluator
- study plan recommender
- spaced-repetition reminders

### Good Enhancement Ideas

- turn past mistakes into targeted drills
- generate follow-up questions based on hesitation
- compare spoken answer structure against a STAR rubric

---

## How to Pick the Right Project in an Interview

Use this filter:

- Does it involve multi-step reasoning?
- Does it take meaningful actions or just answer questions?
- Can I define clear evaluation metrics?
- Are there interesting reliability/safety tradeoffs?
- Can I explain the architecture in under 3 minutes?

If the answer is yes to most of these, the project is useful in an interview.

---

## Architecture Template You Can Reuse

### Ingestion Layer

- user request
- event trigger
- scheduled input

### Planning Layer

- classify intent
- decide whether to retrieve, reason, or act
- build execution plan

### Execution Layer

- invoke tools
- track intermediate state
- retry transient failures

### Safety Layer

- validate arguments
- approval gates
- policy checks
- rate limits

### Evaluation Layer

- task success
- latency
- cost
- failure reasons
- human corrections

---

## Example 2-Minute Answer

"One project I would highlight is an incident triage agent for on-call teams. The problem was that responders were losing the first 10 to 15 minutes gathering context from dashboards, logs, deploy history, and prior incidents. I designed the system as a graph-based workflow with context collection, hypothesis generation, validation, and recommendation stages. The agent could summarize likely causes and suggest next actions, but any remediation like rollback or restart required human approval. For evaluation, I tracked time to first useful summary, routing accuracy, and recommendation acceptance rate. The biggest lesson was that observability mattered more than model cleverness. Once we added step-level traces and failure categorization, iteration became much faster and safer."

---

## Follow-Up Questions Interviewers May Ask

### "Why did this need an agent instead of normal automation?"

Answer:
Because the workflow had partial structure but not full determinism. The system needed to gather context dynamically, weigh multiple signals, and adapt the next step based on the evidence found.

### "How would you evaluate it?"

Use:
- benchmark tasks
- acceptance tests for tools
- human review on sampled outputs
- cost/latency tracking
- failure taxonomy

### "What failed in the first version?"

Strong themes:
- too many tool calls
- weak grounding
- lack of stop conditions
- poor observability
- overly broad autonomy

---

## Red Flags in Project Descriptions

- no metrics
- no safety layer
- no failure handling
- no explanation of why agentic behavior was needed
- overemphasis on prompt engineering without system design

---

## Practice Prompts

Use these to rehearse:

1. Design an agentic system for revenue anomaly investigation.
2. Explain an agent project where approval gates were essential.
3. Compare a retrieval chatbot and a true workflow agent.
4. Describe how you would evaluate an autonomous coding assistant.
5. Walk through how you would productionize a research agent.

---

## 30-Second Summary

- Pick projects with real workflows, tools, and measurable outcomes.
- Explain why an agent was needed instead of deterministic automation.
- Highlight architecture, guardrails, and evaluation.
- Senior answers focus on tradeoffs, rollout safety, and operational learnings.
