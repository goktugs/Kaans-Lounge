# Kaans Lounge

Real-time comment processing system for restaurant comments.

## TEST VIDEOS
  Rest Api

<video src="https://github.com/user-attachments/assets/e01c54c6-b712-431e-a09b-7ed7de9092c9" width="320" height="240" controls></video>


  Grpc Producer-Consumer
  <video src="https://github.com/user-attachments/assets/ea47549e-1481-44df-8af8-6668ee430400" width="320" height="240" controls></video>



## Overview

The system is split into four services:

- `producer-service`: generates raw comments and publishes them to Kafka
- `consumer-service`: consumes raw comments, checks Redis cache, calls the gRPC sentiment service, saves results to MongoDB, and publishes processed records
- `sentiment-grpc-service`: returns deterministic sentiment results and simulates delay, throttling, and transient failures
- `api-service`: reads processed comments from MongoDB and exposes them over HTTP

Supporting infrastructure:

- Kafka running in `KRaft` mode
- MongoDB
- Redis

Runtime target:

- `Node.js 24`

## Repository Structure

```text
.
├── api-service
├── consumer-service
├── docs
├── producer-service
├── sentiment-grpc-service
├── shared
├── docker-compose.yml
├── package.json
└── README.md
```

## Data Flow

1. `producer-service` creates a raw comment.
2. The comment is published to Kafka topic `raw-comments`.
3. `consumer-service` consumes the message.
4. The consumer checks duplicate `commentId`.
5. The consumer checks Redis cache using `sentiment:{textHash}`.
6. On cache miss, the consumer calls `sentiment-grpc-service`.
7. The processed result is saved to MongoDB.
8. The processed result is published to Kafka topic `processed-comments`.
9. `api-service` reads processed comments from MongoDB.

## Environment Variables

Base runtime and infrastructure:

- `NODE_VERSION`: expected runtime target, `24`
- `KAFKA_PORT`: exposed Kafka port, default `9092`
- `MONGODB_PORT`: exposed MongoDB port, default `27017`
- `REDIS_PORT`: exposed Redis port, default `6379`
- `MONGODB_DB`: database name, default `kaans-lounge`

Shared application config:

- `KAFKA_BROKERS`: Kafka broker list, default `localhost:9092`
- `RAW_COMMENTS_TOPIC`: raw input topic, default `raw-comments`
- `PROCESSED_COMMENTS_TOPIC`: processed output topic, default `processed-comments`
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `GRPC_PORT`: gRPC server port, default `50051`
- `GRPC_SENTIMENT_HOST`: gRPC client target, default `localhost:50051`
- `API_PORT`: HTTP API port, default `3000`
- `LOG_LEVEL`: reserved log level setting

Producer:

- `COMMENT_GENERATION_MIN_MS`: minimum publish interval
- `COMMENT_GENERATION_MAX_MS`: maximum publish interval

Sentiment gRPC service:

- `GRPC_RATE_LIMIT_PER_SEC`: max requests per second
- `GRPC_FAILURE_RATE`: deterministic transient failure ratio
- `GRPC_BASE_DELAY_MS`: base processing delay

Consumer:

- `CONSUMER_MAX_RETRIES`: retry limit for transient gRPC failures
- `CONSUMER_RETRY_BACKOFF_MS`: base retry backoff in milliseconds

## Root Workflow

Root `package.json` uses `npm workspaces`, so the whole repo can be managed from the project root.

Install all workspace dependencies:

```bash
npm run install:all
```

Build every service:

```bash
npm run build
```

Start infrastructure:

```bash
npm run infra:up
```

Stop infrastructure:

```bash
npm run infra:down
```

Reset infrastructure volumes:

```bash
npm run infra:reset
```

Start services from the root in separate terminals:

```bash
npm run start:grpc
```

```bash
npm run start:consumer
```

```bash
npm run start:producer
```

```bash
npm run start:api
```

## Full Run Guide

1. Make sure `Node.js 24` is active.
2. From the project root, install dependencies:

```bash
npm run install:all
```

3. Start infrastructure:

```bash
npm run infra:up
```

4. Build all services:

```bash
npm run build
```

5. Open four terminals and start:

Terminal 1:

```bash
npm run start:grpc
```

Terminal 2:

```bash
npm run start:consumer
```

Terminal 3:

```bash
npm run start:producer
```

Terminal 4:

```bash
npm run start:api
```

## End-to-End Test Guide

What you should see:

- `producer-service` publishes raw comments
- `consumer-service` processes, persists, and publishes processed comments
- `sentiment-grpc-service` logs successful analyses and some simulated transient failures
- `api-service` returns stored records

Check raw Kafka topic:

```bash
docker exec -it kaans-lounge-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic raw-comments --from-beginning
```

Check processed Kafka topic:

```bash
docker exec -it kaans-lounge-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic processed-comments --from-beginning
```

Check Redis cache keys:

```bash
docker exec -it kaans-lounge-redis redis-cli keys 'sentiment:*'
```

Read one cache entry:

```bash
docker exec -it kaans-lounge-redis redis-cli get sentiment:<full-text-hash>
```

Inspect MongoDB:

```bash
docker exec -it kaans-lounge-mongodb mongosh
```

Then:

```javascript
use("kaans-lounge")
db.processed_comments.find().pretty()
```

## API Examples

List comments:

```bash
curl http://localhost:3000/api/v1/comments
```

Paginated list:

```bash
curl "http://localhost:3000/api/v1/comments?page=1&limit=10"
```

Filter by status:

```bash
curl "http://localhost:3000/api/v1/comments?status=processed"
```

Filter by sentiment:

```bash
curl "http://localhost:3000/api/v1/comments?sentiment=positive"
```

Filter by date:

```bash
curl "http://localhost:3000/api/v1/comments?from=2026-04-03T00:00:00.000Z&to=2026-04-03T23:59:59.999Z"
```

Get one comment:

```bash
curl http://localhost:3000/api/v1/comments/<commentId>
```

## Notes

- MongoDB is the source of truth
- Redis is cache only
- Kafka is transport only
- Same `textHash` always maps to the same sentiment
- Some `UNAVAILABLE` logs are expected because transient failure simulation is enabled
