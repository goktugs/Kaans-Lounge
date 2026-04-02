# Service Boundaries

## Producer Service

- Generates or receives raw restaurant comments
- Computes `textHash` before publishing
- Publishes messages to Kafka topic `raw-comments`
- Must not perform sentiment analysis

## Consumer Service

- Consumes `raw-comments`
- Enforces idempotency with `commentId`
- Checks Redis cache using `sentiment:{textHash}`
- Calls sentiment gRPC service when cache miss occurs
- Persists final state to MongoDB
- Publishes result to `processed-comments`

## Sentiment gRPC Service

- Accepts comment text or text hash based requests
- Returns deterministic sentiment for the same `textHash`
- Can simulate latency, throttling, and transient failures
- Does not persist data

## API Service

- Reads processed comments from MongoDB
- Exposes `GET /comments` and `GET /comments/:commentId`
- Does not read from Kafka directly

## Infrastructure Contracts

- MongoDB is the source of truth
- Redis is a cache layer only
- Kafka is the transport between producer and consumer flows
- `processed-comments` contains the latest processing state
