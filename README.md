# Kaans Lounge

Real-time comment processing system organized as multiple services.

## Runtime

- `Node.js 24`

## Services

- `producer-service`
- `consumer-service`
- `sentiment-grpc-service`
- `api-service`

## Shared

- `shared/types`
- `shared/utils`
- `shared/constants`
- `shared/proto`

## Infrastructure

- `Kafka` running in `KRaft` mode
- `MongoDB`
- `Redis`
- `Docker Compose`

## Status

- Base project structure initialized
- Local infrastructure setup added with `docker-compose.yml`
- Business logic will be added in later tasks
