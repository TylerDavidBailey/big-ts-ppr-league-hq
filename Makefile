# Sleeper League HQ
#
# Run `make` on its own for the task list.
# Everything here assumes Node 22+ (see .nvmrc). Nothing needs Docker or a
# server: the app talks to Sleeper's public API straight from the browser.

SHELL := /bin/bash
.DEFAULT_GOAL := help
.DELETE_ON_ERROR:
MAKEFLAGS += --no-print-directory

# --- Configuration -----------------------------------------------------------

DEV_PORT     ?= 5173
PREVIEW_PORT ?= 4173
RUN_DIR      := .make
DEV_PID      := $(RUN_DIR)/dev.pid
DEV_LOG      := $(RUN_DIR)/dev.log
PREVIEW_PID  := $(RUN_DIR)/preview.pid
PREVIEW_LOG  := $(RUN_DIR)/preview.log

# The dev server runs at the root; `vite preview` mirrors the GitHub Pages
# sub-path so a preview catches base-path mistakes before deploy.
DEV_URL      := http://localhost:$(DEV_PORT)/
PREVIEW_URL  := http://localhost:$(PREVIEW_PORT)/sleeper-league-hq/

# A league with four seasons of real data, handy for a quick smoke test.
SAMPLE_LEAGUE ?= 1373305494734651392

# --- Pretty output -----------------------------------------------------------

ifneq (,$(findstring xterm,$(TERM)))
  BOLD  := $(shell tput bold)
  DIM   := $(shell tput dim)
  CYAN  := $(shell tput setaf 6)
  GREEN := $(shell tput setaf 2)
  RESET := $(shell tput sgr0)
endif

define say
	@printf "$(CYAN)▸$(RESET) %s\n" $(1)
endef

define ok
	@printf "$(GREEN)✓$(RESET) %s\n" $(1)
endef

.PHONY: help
help: ## Show this help
	@printf "\n  $(BOLD)Sleeper League HQ$(RESET)\n"
	@printf "  $(DIM)make <target>$(RESET)\n\n"
	@awk 'BEGIN { FS = ":.*##" } \
		/^## ---/ { section = $$0; sub(/^## -+ */, "", section); sub(/ *-+ *##$$/, "", section); \
		            printf "\n  $(BOLD)%s$(RESET)\n", section; next } \
		/^[a-zA-Z0-9_-]+:.*##/ { printf "    $(CYAN)%-16s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@printf "\n  $(DIM)Quick start: make up  →  $(DEV_URL)$(RESET)\n\n"

## --- Setup ------------------------------------------------------------- ##

.PHONY: install
install: node_modules ## Install dependencies (only if they are stale)

node_modules: package-lock.json package.json
	$(call say,"Installing dependencies")
	@npm ci
	@touch node_modules

.PHONY: reinstall
reinstall: ## Delete node_modules and install from scratch
	@rm -rf node_modules
	@$(MAKE) install

## --- Run --------------------------------------------------------------- ##

.PHONY: dev
dev: install ## Start the dev server in the foreground (Ctrl-C to stop)
	@npx vite --port $(DEV_PORT) --strictPort

.PHONY: up
up: install ## Start the dev server in the background
	@set -e; \
	if [ -f $(DEV_PID) ] && kill -0 "$$(cat $(DEV_PID))" 2>/dev/null; then \
		printf "$(GREEN)✓$(RESET) Already running at $(DEV_URL) (pid %s)\n" "$$(cat $(DEV_PID))"; \
		exit 0; \
	fi; \
	mkdir -p $(RUN_DIR); \
	printf "$(CYAN)▸$(RESET) Starting dev server on port $(DEV_PORT)\n"; \
	npx vite --port $(DEV_PORT) --strictPort > $(DEV_LOG) 2>&1 & \
	echo $$! > $(DEV_PID); \
	for _ in $$(seq 1 60); do \
		curl -sf -o /dev/null "$(DEV_URL)" && break; \
		sleep 0.25; \
	done; \
	if curl -sf -o /dev/null "$(DEV_URL)"; then \
		printf "$(GREEN)✓$(RESET) $(DEV_URL)\n"; \
		printf "  $(DIM)Sample league: $(DEV_URL)#/l/$(SAMPLE_LEAGUE)$(RESET)\n"; \
		printf "  $(DIM)Logs: make logs   Stop: make down$(RESET)\n"; \
	else \
		printf "Dev server did not come up. Last output:\n"; tail -20 $(DEV_LOG); \
		rm -f $(DEV_PID); exit 1; \
	fi

.PHONY: down
down: ## Stop the background dev and preview servers
	@$(MAKE) _stop PID_FILE=$(DEV_PID) PORT=$(DEV_PORT) NAME="dev server"
	@$(MAKE) _stop PID_FILE=$(PREVIEW_PID) PORT=$(PREVIEW_PORT) NAME="preview server"

.PHONY: _stop
_stop:
	@stopped=""; \
	if [ -f $(PID_FILE) ]; then \
		pid=$$(cat $(PID_FILE)); \
		if kill -0 "$$pid" 2>/dev/null; then kill "$$pid" 2>/dev/null || true; stopped="$$pid"; fi; \
		rm -f $(PID_FILE); \
	fi; \
	sleep 0.3; \
	orphans=$$(lsof -ti tcp:$(PORT) 2>/dev/null || true); \
	if [ -n "$$orphans" ]; then \
		kill $$orphans 2>/dev/null || true; \
		sleep 0.3; \
		kill -9 $$(lsof -ti tcp:$(PORT) 2>/dev/null) 2>/dev/null || true; \
		stopped="$$stopped $$orphans"; \
	fi; \
	stopped=$$(echo $$stopped | xargs); \
	if [ -n "$$stopped" ]; then printf "$(GREEN)✓$(RESET) Stopped $(NAME) (pid %s)\n" "$$stopped"; \
	else printf "$(DIM)○ $(NAME) was not running$(RESET)\n"; fi

.PHONY: restart
restart: down up ## Restart the background dev server

.PHONY: status
status: ## Show whether the local servers are running
	@if [ -f $(DEV_PID) ] && kill -0 "$$(cat $(DEV_PID))" 2>/dev/null; then \
		printf "$(GREEN)●$(RESET) dev     $(DEV_URL) (pid %s)\n" "$$(cat $(DEV_PID))"; \
	else printf "$(DIM)○ dev     stopped$(RESET)\n"; fi
	@if [ -f $(PREVIEW_PID) ] && kill -0 "$$(cat $(PREVIEW_PID))" 2>/dev/null; then \
		printf "$(GREEN)●$(RESET) preview $(PREVIEW_URL) (pid %s)\n" "$$(cat $(PREVIEW_PID))"; \
	else printf "$(DIM)○ preview stopped$(RESET)\n"; fi

.PHONY: logs
logs: ## Tail the background dev server log
	@touch $(DEV_LOG) && tail -f $(DEV_LOG)

.PHONY: open
open: ## Open the running app in a browser
	@open "$(DEV_URL)" 2>/dev/null || xdg-open "$(DEV_URL)" 2>/dev/null || printf "Open $(DEV_URL)\n"

## --- Build ------------------------------------------------------------- ##

.PHONY: build
build: install ## Type-check and build for production into dist/
	$(call say,"Building")
	@npm run build
	$(call ok,"dist/ is ready")

.PHONY: preview
preview: build ## Build, then serve dist/ in the foreground
	@npx vite preview --port $(PREVIEW_PORT) --strictPort

.PHONY: preview-up
preview-up: build ## Build, then serve dist/ in the background
	@mkdir -p $(RUN_DIR)
	$(call say,"Serving dist/ on port $(PREVIEW_PORT)")
	@npx vite preview --port $(PREVIEW_PORT) --strictPort > $(PREVIEW_LOG) 2>&1 & echo $$! > $(PREVIEW_PID)
	@for _ in $$(seq 1 60); do \
		curl -sf -o /dev/null "$(PREVIEW_URL)" && break; \
		sleep 0.25; \
	done
	@printf "$(GREEN)✓$(RESET) $(PREVIEW_URL)\n"

## --- Quality ----------------------------------------------------------- ##

.PHONY: check
check: lint typecheck test build e2e ## Everything CI runs, in the same order
	$(call ok,"All checks passed")

.PHONY: check-fast
check-fast: lint typecheck test build ## Same as check, without the browser tests
	$(call ok,"All checks passed")

.PHONY: lint
lint: install ## Lint with ESLint and check formatting
	@npm run lint
	@npm run format:check

.PHONY: fix
fix: install ## Auto-fix lint findings and reformat
	@npm run lint:fix
	@npm run format
	$(call ok,"Fixed what could be fixed")

.PHONY: format
format: install ## Reformat every file with Prettier
	@npm run format

.PHONY: typecheck
typecheck: install ## Type-check without emitting
	@npm run typecheck

.PHONY: test
test: install ## Run the unit tests once
	@npm run test

.PHONY: watch
watch: install ## Run the tests in watch mode
	@npm run test:watch

.PHONY: coverage
coverage: install ## Run tests and write a coverage report
	@npm run coverage

.PHONY: e2e
e2e: install browsers ## Run the browser tests against mocked Sleeper responses
	@npm run e2e

.PHONY: e2e-ui
e2e-ui: install browsers ## Run the browser tests in Playwright's interactive UI
	@npm run e2e:ui

.PHONY: e2e-live
e2e-live: install browsers ## Run the browser tests against the real Sleeper API
	$(call say,"Hitting the live Sleeper API")
	@E2E_LIVE=1 npm run e2e -- --grep @live

.PHONY: e2e-report
e2e-report: ## Open the last browser-test report
	@npm run e2e:report

.PHONY: browsers
browsers: $(RUN_DIR)/browsers.stamp ## Download the Playwright browsers

$(RUN_DIR)/browsers.stamp: package-lock.json
	$(call say,"Downloading Playwright browsers")
	@npx playwright install --with-deps chromium chromium-headless-shell
	@mkdir -p $(RUN_DIR) && touch $@

## --- Data -------------------------------------------------------------- ##

.PHONY: players
players: install ## Refresh public/data/players.min.json from Sleeper
	@npm run players

.PHONY: fixtures
fixtures: install ## Re-capture the test fixtures from a real league
	@npm run fixtures

## --- Housekeeping ------------------------------------------------------- ##

.PHONY: clean
clean: down ## Stop servers and remove build output
	@rm -rf dist coverage playwright-report test-results $(RUN_DIR) node_modules/.tmp
	$(call ok,"Cleaned")

.PHONY: nuke
nuke: clean ## clean, plus delete node_modules
	@rm -rf node_modules
	$(call ok,"Nuked")
