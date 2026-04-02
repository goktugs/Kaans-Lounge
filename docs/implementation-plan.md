# Implementation Plan — Real-Time Comment Processing System

## Execution Protocol

- Each step in this document is considered a separate task.
- Tasks must be executed strictly one at a time.
- Do not proceed to the next task unless explicitly instructed.
- After completing a task:
    - summarize what was done
    - list created/updated files
    - mention assumptions if any
    - wait for confirmation before continuing

---

## Phase 1 — Architecture

Define services, data models, Kafka topics

---

## Phase 2 — Setup

Create services:

- producer-service
- consumer-service
- sentiment-grpc-service
- api-service

---

## Phase 3 — Infrastructure

Setup Kafka (`KRaft`), MongoDB, Redis with Docker Compose

---

## Phase 4 — Shared Layer

Define types, `textHash` utility, constants, shared contracts

---

## Phase 5 — gRPC Service

Random + deterministic sentiment, delay, rate limit, drop

---

## Phase 6 — Producer

Generate lorem ipsum comments, publish to Kafka

---

## Phase 7 — Consumer

Process flow:

1. Read message
2. Check duplicate
3. Check cache
4. Call gRPC
5. Retry
6. Save
7. Publish processed

---

## Phase 8 — REST API

Endpoints:

- GET /api/v1/comments
- GET /api/v1/comments/:commentId

---

## Phase 9 — Integration

Validate configs, schemas, topics

---

## Phase 10 — Finalization

README, run instructions, Node.js 24 note, test locally

---

## Rules

- MongoDB source of truth
- Redis cache by textHash
- Same textHash => same sentiment
- Retry bounded
- No infinite loops
- Runtime target: Node.js 24
