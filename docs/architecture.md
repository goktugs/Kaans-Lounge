# Architecture — Real-Time Comment Processing System

## Execution Protocol

- Each step in this document is a separate task.
- Tasks must be executed strictly one at a time.
- Do not move to the next task unless explicitly instructed.
- After completing each task:
    - summarize what was done
    - list created or updated files
    - mention assumptions if any
    - stop and wait for approval

---

## Task 1 — Define architecture and repository plan

### Goal

Define the overall system structure before starting implementation.

### Deliverables

- Service list
- Service responsibilities
- High-level data flow
- Repository/folder structure
- Port plan
- Kafka topic plan
- Environment variable plan
- Runtime baseline (`Node.js 24`)

### Important

- No code yet
- No project scaffolding yet
- No package installation yet

### Stop condition

Stop after presenting the architecture and repository plan.

---

## Task 2 — Create base project structure

### Goal

Create the main repository structure for all services.

### Deliverables

- Root project structure
- Service folders:
    - `producer-service`
    - `consumer-service`
    - `sentiment-grpc-service`
    - `api-service`
- Optional shared folder if needed
- Base TypeScript configuration
- Base environment file structure
- Minimal README skeleton

### Important

- No business logic yet
- No infrastructure setup yet
- No Kafka/gRPC/Mongo/Redis code yet

### Stop condition

Stop after showing the folder structure.

---

## Task 3 — Add infrastructure setup

### Goal

Prepare the local development infrastructure.

### Deliverables

- `docker-compose.yml`
- Kafka in `KRaft` mode
- MongoDB
- Redis
- Port mappings
- Basic environment wiring

### Important

- No application business logic yet
- Only infrastructure configuration

### Stop condition

Stop after explaining the infrastructure setup.

---

## Task 4 — Implement sentiment gRPC service

### Goal

Build the sentiment analysis service as a gRPC service.

### Deliverables

- `.proto` definition
- gRPC server setup
- Request/response handling
- First-time random sentiment generation
- Deterministic response for same text
- Artificial delay based on text length
- Rate limit logic
- Random failure/drop simulation
- Logging

### Important

- Same input text or `textHash` must always return the same sentiment
- Keep implementation simple and readable

### Stop condition

Stop after explaining how the gRPC service works.

---

## Task 5 — Implement producer service

### Goal

Build the producer that generates comments and publishes them to Kafka.

### Deliverables

- Kafka producer setup
- Lorem ipsum-like comment generation
- Variable generation intervals
- Reuse of same text with different `commentId` in some cases
- Logging

### Important

- Messages must be published to `raw-comments`
- Include `commentId`, `text`, `textHash`, `createdAt`

### Stop condition

Stop after showing how comments are generated and published.

---

## Task 6 — Implement consumer service

### Goal

Build the consumer that processes incoming comments.

### Deliverables

- Kafka consumer setup for `raw-comments`
- Duplicate check by `commentId`
- Redis cache lookup by `textHash`
- gRPC client integration
- Retry with bounded backoff
- Failure handling (`pending` or `failed`)
- Logging

### Processing Flow

1. Read message from Kafka
2. Check if `commentId` already exists
3. Check Redis cache
4. Call gRPC service if needed
5. Retry on failure with bounds
6. Prepare processed result

### Important

- No infinite retry loops
- Avoid unnecessary gRPC calls
- Skip already processed comments safely

### Stop condition

Stop after explaining the processing flow and retry strategy.

---

## Task 7 — Add database persistence to consumer service

### Goal

Persist processed comment records in MongoDB.

### Deliverables

- MongoDB connection setup
- Comment schema/model
- Save processed comments
- Ensure `commentId` uniqueness
- Persist these fields:
  - `commentId`
  - `text`
  - `textHash`
  - `sentiment`
  - `status`
  - `createdAt`
  - `analyzedAt`
  - `retryCount`

### Important

- MongoDB is the source of truth
- Persistence must align with the processing result

### Stop condition

Stop after explaining schema and persistence behavior.

---

## Task 8 — Publish processed messages to Kafka

### Goal

Publish processed records to the `processed-comments` topic.

### Deliverables

- Kafka producer setup inside consumer service
- Publish processed comment payloads
- Logging

### Important

- Published payload must match processed comment structure

### Stop condition

Stop after showing how processed messages are published.

---

## Task 9 — Implement REST API service

### Goal

Expose processed comments via REST API.

### Deliverables

- API service setup
- MongoDB read integration
- `GET /comments`
- `GET /comments/:commentId`
- Filtering:
  - `sentiment`
  - `status`
  - `from`
  - `to`
- Pagination:
  - `page`
  - `limit`
- Default sorting by `createdAt` descending
- 404 behavior for missing `commentId`
- Logging

### Important

- Read only from MongoDB
- Keep the API simple and clear

### Stop condition

Stop after explaining endpoint behavior and example responses.

---

## Task 10 — Integration review

### Goal

Review the whole system and fix inconsistencies.

### Deliverables

- Verify ports
- Verify environment variables
- Verify Kafka topic names
- Verify gRPC configuration
- Verify MongoDB schema consistency
- Verify Redis key usage
- Fix startup/config mismatches if needed

### Stop condition

Stop after presenting the integration summary.

---

## Task 11 — Final documentation and run guide

### Goal

Complete the final documentation.

### Deliverables

- Final README
- Project overview
- Architecture summary
- Run instructions
- Environment variables
- Example API calls
- Retry/failure explanation
- Duplicate text handling explanation
- Node.js version requirement (`24`)

### Stop condition

Stop after presenting the documentation summary.

---

## Rules

- MongoDB is the source of truth
- Redis is used for sentiment caching by `textHash`
- Same `textHash` must always return the same sentiment
- Avoid unnecessary gRPC calls
- Retry must be bounded
- No infinite loops
- If processing fails, store status as `pending` or `failed`
