NAME = nadis-web
COMPOSE_FILE = docker-compose.yml
COMPOSE_FILE_DEV = docker-compose.dev.yml
COMPOSE_FILE_CI = docker-compose.ci.yml

TAG = $(shell git rev-parse --short HEAD 2>/dev/null || echo "no-git")

-include .env

# Check the ENV variable and set COMPOSE_FILE accordingly
ifeq ($(ENV),dev)
    COMPOSE_FILE := $(COMPOSE_FILE_DEV)
else ifeq ($(ENV),ci)
    COMPOSE_FILE := $(COMPOSE_FILE_CI)
else ifeq ($(ENV),prod)
    COMPOSE_FILE := $(COMPOSE_FILE)
else
    $(error Invalid ENV variable: $(ENV), please use one of (dev, ci, prod))
endif

export COMPOSE_FILE


all:
	@echo "Tag $(TAG)"
	@echo "Using $(COMPOSE_FILE)"

build: 
	docker compose -f ${COMPOSE_FILE} build

build-prod: ## Build production version and output to dist folder
	@echo "Building production version..."
	@docker compose exec nadis-web npm ci
	@docker compose exec nadis-web npm run build-only
	@echo "Production build completed. Files are in web/dist/"

run: # Run RETAIL engine in a container
	@docker compose up -d nadis-web


fix-lint:
	@docker run --rm -v $(PWD)/src:/app -w /app ghcr.io/astral-sh/ruff:0.8.0 check --fix .
	@docker run --rm -v $(PWD)/src:/app -w /app ghcr.io/astral-sh/ruff:0.8.0 format .

tests: test lint ## Run the unit tests and lint

stop: ##Stop the services required for the dev environment
	@docker compose stop

logs: ## Logs
	@docker compose logs --tail=500 -f

shell: ## Shell into the main container
	@docker compose exec nadis-web sh

down: ## Stop the services and remove containers and volumes
	@docker compose down --volumes

clean: ## Stop the services and remove containers, volumes and docker images
	@docker compose down --volumes --rmi all


ps: all ## view current running containers
	@docker compose -f ${COMPOSE_FILE_DEV} ps


.PHONY:  build build-prod run test stop logs shell down clean ps migrate load-data create-wallets setup
.EXPORT_ALL_VARIABLES: