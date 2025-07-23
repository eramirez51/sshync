VERSION?=latest
NAME?=codesync
ENV?=dev

# Extract version from package.json
CODESYNC_VERSION=$(shell cat package.json | grep "\"version\": " | cut -d"\"" -f4)

# Nexus repository URLs
NEXUS_BASE_URL=http://prod.nexus.infra.search-reco.unext-recommender-system.unext.me
NEXUS_NPM_REPO=$(NEXUS_BASE_URL)/repository/npm-internal/
NEXUS_BINARIES_REPO=$(NEXUS_BASE_URL)/repository/binaries/

# Authentication (adjust as needed)
NEXUS_USER?=admin
NEXUS_PASS?=admin123

.PHONY: build push install configure_npm install_from_nexus clean

# Build the npm package
build:
	@echo "Building codesync v$(CODESYNC_VERSION) package..."
	npm pack

# Push codesync to Nexus npm repository
push: build
	@echo "Pushing codesync v$(CODESYNC_VERSION) to Nexus npm repository..."
	npm publish codesync-$(CODESYNC_VERSION).tgz --registry=$(NEXUS_NPM_REPO)

# Alternative: Upload as binary to Nexus binaries repository  
push_binary: build
	@echo "Uploading codesync v$(CODESYNC_VERSION) to Nexus binaries repository..."
	curl -v --user '$(NEXUS_USER):$(NEXUS_PASS)' \
		--upload-file codesync-$(CODESYNC_VERSION).tgz \
		$(NEXUS_BINARIES_REPO)codesync-$(ENV)-$(CODESYNC_VERSION).tgz

# Configure npm to use your Nexus registry
configure_npm:
	@echo "Configuring npm to use Nexus repository..."
	npm config set registry $(NEXUS_NPM_REPO)
	npm config set _auth $(shell echo -n "$(NEXUS_USER):$(NEXUS_PASS)" | base64)

# Install codesync from Nexus on another machine
install:
	@echo "Installing codesync from Nexus repository..."
	npm install -g codesync@$(CODESYNC_VERSION) --registry=$(NEXUS_NPM_REPO)

# Clean up generated files
clean:
	rm -f codesync-*.tgz

# Show current version
version:
	@echo "Current version: $(CODESYNC_VERSION)"

# Help target
help:
	@echo "Available targets:"
	@echo "  build           - Create npm package (.tgz file)"
	@echo "  push            - Build and publish to Nexus npm repository"
	@echo "  push_binary     - Build and upload as binary to Nexus binaries repository"
	@echo "  configure_npm   - Configure npm to use Nexus registry"
	@echo "  install         - Install codesync from Nexus on another machine"
	@echo "  clean           - Remove generated package files"
	@echo "  version         - Show current version"
	@echo "  help            - Show this help"
	@echo ""
	@echo "Environment variables:"
	@echo "  ENV             - Environment (dev/prod, default: dev)"
	@echo "  NEXUS_USER      - Nexus username (default: admin)"
	@echo "  NEXUS_PASS      - Nexus password (default: admin123)"