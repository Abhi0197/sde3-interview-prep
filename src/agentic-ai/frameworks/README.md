# Agentic AI Frameworks - SDE 3 Revision Guide

**Framework questions are usually not about memorizing APIs.** Interviewers want to know whether you can choose the right abstraction, manage failure modes, and keep an agent system observable in production.

---

## Why Frameworks Exist

Building an agent loop from scratch is possible, but teams often adopt frameworks to avoid repeatedly solving:

- Tool registration and validation
- Message/state management
- Retry and recovery flows
- Multi-step planning orchestration
- Memory wiring
- Tracing and observability
- Human-in-the-loop checkpoints

**Senior-level expectation**: you should be able to explain when a framework accelerates delivery and when it adds unnecessary indirection.

---

## Mental Model: What a Good Framework Should Provide

Evaluate frameworks on these dimensions:

| Dimension | What Good Looks Like | Interview Talking Point |
|----------|----------------------|-------------------------|
| State handling | Clear step-level state transitions | "Can I resume, replay, or inspect runs?" |
| Tooling | Typed tools with validation | "How do I prevent malformed tool calls?" |
| Control flow | Branching, retries, fallback paths | "Can I model non-happy paths?" |
| Observability | Traces, logs, token/tool metrics | "How do I debug bad agent behavior?" |
| Memory | Short-term and long-term options | "What belongs in prompt vs storage?" |
| Human review | Approval checkpoints | "Where do I need safety gates?" |
| Deployment | Works in APIs, jobs, and async workers | "Can this operate reliably in production?" |

---

## Common Framework Families

### 1. Graph-Based Orchestration

Examples: **LangGraph**, custom workflow DAGs

Best for:
- Multi-step flows with explicit control
- Retryable long-running agents
- Branching and stateful workflows
- Production systems where debuggability matters

Strengths:
- Deterministic control flow
- Easier to reason about than free-form agent loops
- Natural fit for checkpoints and approvals

Weaknesses:
- More setup than a simple prompt + tool call loop
- Can become verbose for small problems

**Interview-ready line**:
"For production agent systems, I prefer graph-style orchestration because it makes state transitions explicit and easier to replay, test, and observe."

### 2. Conversational Multi-Agent Frameworks

Examples: **AutoGen**, **CrewAI**

Best for:
- Role-based collaboration demos
- Rapid experimentation
- Research assistants, planning agents, reviewers

Strengths:
- Quick to prototype multiple agents
- Natural mapping for role-based systems
- Good for exploratory workflows

Weaknesses:
- Harder to control cost explosion
- Agent-to-agent chatter can become noisy
- Debugging emergent behavior can be difficult

**Interview caution**:
Do not present multi-agent architectures as automatically better. Many tasks are solved more reliably by a single orchestrated agent with well-defined tools.

### 3. SDK-Centric Orchestration

Examples: **Semantic Kernel**, internal orchestration SDKs

Best for:
- Enterprise teams
- Strong integration with existing service architecture
- Policy-heavy production environments

Strengths:
- Better fit with typed services and dependency injection
- Easier to integrate with enterprise auth, telemetry, and compliance
- More maintainable for large engineering teams

Weaknesses:
- Less flexible for fast experimentation
- Can feel heavy for hackathon-style builds

### 4. No Framework / Lightweight Custom Orchestrator

Best for:
- Single-agent systems
- Strictly bounded workflows
- Teams that want minimal abstraction

Strengths:
- Maximum clarity
- Lower dependency and lock-in risk
- Easier to tailor to your exact needs

Weaknesses:
- You own retries, memory, tracing, and failure handling
- Scaling complexity becomes painful

**Senior tradeoff**:
Start with a lightweight orchestrator when the workflow is simple. Introduce a framework when the system needs branching, resumability, or shared conventions across multiple agents.

---

## Framework Selection Heuristic

Use this quick decision guide:

### Choose a Graph-Based Framework When

- The workflow has clear stages
- Human approvals matter
- Tool reliability varies
- You need replayability and debugging
- You are shipping to production soon

### Choose a Conversational Multi-Agent Framework When

- You are prototyping collaborative behaviors
- Roles genuinely help decomposition
- The task is open-ended research or synthesis
- You are still exploring the product surface

### Choose Custom Lightweight Orchestration When

- There are only 1-3 tools
- The loop is short
- Failures are easy to reason about
- The team wants very explicit control

---

## Example: Framework Choice in an Interview

**Question**: "How would you choose between LangGraph and a custom orchestrator for a customer support agent?"

Strong answer structure:

1. Clarify requirements
   - Is this a production support workflow or an experiment?
   - Do we need approvals for refunds or account changes?
   - Must runs be resumable?

2. Compare the options
   - Custom orchestrator is enough for FAQ retrieval + ticket creation
   - LangGraph becomes valuable if we add branching, escalation, policy checks, and retries

3. Make a recommendation
   - "I would start with a small custom orchestrator if scope is narrow. If we are already expecting multi-step case resolution with approvals and replayability, I would use a graph-based framework early."

4. Mention operational concerns
   - tracing
   - token/cost controls
   - prompt versioning
   - guardrails before side effects

---

## Production Concerns Interviewers Care About

### 1. Cost Control

- Cap max steps
- Limit tool retries
- Cache retrieval and repeated tool results
- Use smaller models for routing/classification
- Use larger models only for planning or synthesis

### 2. Safety

- Validate tool inputs
- Add allowlists for dangerous actions
- Require approval before irreversible mutations
- Log all tool calls with actor, time, and context

### 3. Reliability

- Distinguish model error from tool error
- Retry transient failures only
- Fall back to a deterministic path where possible
- Keep agent state external so runs can resume

### 4. Observability

Track:
- latency per step
- token usage
- tool success rate
- retries
- abandonment rate
- human override frequency

---

## Common Interview Questions

### Q1. "What is the biggest risk of using an agent framework?"

Good answer:
"The biggest risk is hiding complexity under a high-level abstraction. Teams may move faster initially but lose clarity around state transitions, retries, and failure handling. I want a framework that improves control and observability, not one that turns the workflow into magic."

### Q2. "When would you avoid a multi-agent framework?"

- When the problem is linear
- When the task can be handled by retrieval + one tool call
- When latency and cost are strict
- When debugging needs to be simple

### Q3. "How do you test agent frameworks?"

- Unit test tools separately
- Simulate tool failures
- Snapshot workflow state transitions
- Evaluate end-to-end traces on a benchmark set
- Include adversarial prompts and malformed tool outputs

---

## Mini Design Exercise

**Design an incident-response agent for cloud operations.**

Suggested architecture:

1. Router node
   - classify alert severity
2. Context collector node
   - fetch logs, metrics, deploy history
3. Hypothesis node
   - generate likely root causes
4. Validation node
   - run safe diagnostic tools
5. Recommendation node
   - propose next actions
6. Approval gate
   - human approval for restart, rollback, or scaling actions
7. Executor node
   - perform approved action
8. Postmortem node
   - summarize the incident and timeline

Why graph orchestration fits:
- explicit branching
- controlled side effects
- resumable state
- easier audit trail

---

## Red Flags in Answers

- "Framework X is the best one."
- "More agents means better quality."
- "The model will figure out retries on its own."
- "We can debug it from logs later."
- "We don't need approvals if prompts are good."

---

## 30-Second Summary

- Frameworks help with orchestration, state, tooling, and observability.
- Choose the lightest abstraction that still gives you control.
- For production systems, explicit state and safe side-effect management matter more than flashy autonomy.
- A strong senior answer focuses on tradeoffs, not framework fandom.
