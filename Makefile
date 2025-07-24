VERSION?=latest
NAME?=codesync
ENV?=dev

# Extract version from package.json
CODESYNC_VERSION=$(shell cat package.json | grep "\"version\": " | cut -d"\"" -f4)

# Nexus repository URLs
NEXUS_NPM_REPO=http://prod.nexus.infra.search-reco.unext-recommender-system.unext.me/repository/npm-internal/

# No credentials stored - use 'make login' instead

.PHONY: build push login install install_latest clean

# Build the npm package
build:
	@echo "Building codesync v$(CODESYNC_VERSION) package..."
	npm pack

# Push codesync to Nexus npm repository
push: build
	@echo "Pushing codesync v$(CODESYNC_VERSION) to Nexus npm repository..."
	npm publish codesync-$(CODESYNC_VERSION).tgz --registry=$(NEXUS_NPM_REPO)


# One-time setup: Login to Nexus npm registry
login:
	@echo "Logging into Nexus npm registry..."
	@echo "You'll be prompted for username and password"
	npm login --registry=$(NEXUS_NPM_REPO)

# Install codesync from Nexus (no auth required for pulling)
install:
	@echo "Installing codesync from Nexus repository..."
	npm install -g codesync@$(CODESYNC_VERSION) --registry=$(NEXUS_NPM_REPO)

# Install latest version without specifying version
install_latest:
	@echo "Installing latest codesync from Nexus repository..."
	npm install -g codesync --registry=$(NEXUS_NPM_REPO)

# Clean up generated files
clean:
	rm -f codesync-*.tgz

# Show current version
version:
	@echo "Current version: $(CODESYNC_VERSION)"

# Help target
help:
	@echo "Available targets:"
	@echo "  login           - One-time login to Nexus npm registry"
	@echo "  build           - Create npm package (.tgz file)"
	@echo "  push            - Build and publish to Nexus npm repository"
	@echo "  install         - Install codesync from Nexus (no auth required)"
	@echo "  install_latest  - Install latest codesync from Nexus (no auth required)"
	@echo "  clean           - Remove generated package files"
	@echo "  version         - Show current version"
	@echo "  help            - Show this help"
	@echo ""
	@echo "Usage:"
	@echo "  1. make login    # One-time setup"
	@echo "  2. make build"
	@echo "  3. make push"
