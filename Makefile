
SHELL		= bash


#
# Project
#
use-local-holo-hash:
	cd tests; npm uninstall @spartan-hc/holo-hash
	cd tests; npm install --save ../../holo-hash-js/
use-npm-holo-hash:
	cd tests; npm uninstall @spartan-hc/holo-hash
	cd tests; npm install --save @spartan-hc/holo-hash

use-local-backdrop:
	cd tests; npm uninstall @spartan-hc/holochain-backdrop
	cd tests; npm install --save-dev ../../node-holochain-backdrop
use-npm-backdrop:
	cd tests; npm uninstall @spartan-hc/holochain-backdrop
	cd tests; npm install --save-dev @spartan-hc/holochain-backdrop

use-local:		use-local-client use-local-backdrop
use-npm:		  use-npm-client   use-npm-backdrop


#
# Testing
#
tests/package-lock.json:	tests/package.json
	touch $@
tests/node_modules:		tests/package-lock.json
	cd tests; npm install
	touch $@
test:				test-unit test-integration
test-debug:			test-unit-debug test-integration-debug
test-setup:			tests/node_modules

test-unit:
	cargo test --quiet --tests
test-unit-debug:
	RUST_BACKTRACE=1 cargo test --tests -- --nocapture --show-output

DNA_NAME			= happy_path
TEST_DNA			= tests/dnas/$(DNA_NAME).dna
TEST_DNA_WASM			= tests/zomes/$(DNA_NAME).wasm

tests/dnas/%.dna:		tests/dnas/%/dna.yaml tests/zomes/%.wasm
	hc dna pack -o $@ tests/dnas/$*/

tests/zomes/%.wasm:		tests/zomes/%/src/*.rs tests/zomes/%/Cargo.toml Cargo.toml src/*.rs
	cd tests/zomes/; RUST_BACKTRACE=1 CARGO_TARGET_DIR=target cargo build --release \
	    --target wasm32-unknown-unknown \
	    --package $*
	mv tests/zomes/target/wasm32-unknown-unknown/release/$*.wasm $@

test-integration:		test-setup $(TEST_DNA)
	cd tests; npx mocha integration/test_basic.js
test-integration-debug:		test-setup $(TEST_DNA)
	cd tests; RUST_LOG=info LOG_LEVEL=trace npx mocha integration/test_basic.js



#
# Packages
#
preview-crate:			test-debug
	cargo publish --dry-run --allow-dirty
publish-crate:			test-debug .cargo/credentials
	cargo publish
.cargo/credentials:
	cp ~/$@ $@



#
# Documentation
#
test-docs:
	cargo test --doc
build-docs:			test-docs
	cargo doc



#
# Repository
#
clean-remove-chaff:
	@find . -name '*~' -exec rm {} \;
clean-files:		clean-remove-chaff
	git clean -nd
clean-files-force:	clean-remove-chaff
	git clean -fd
clean-files-all:	clean-remove-chaff
	git clean -ndx
clean-files-all-force:	clean-remove-chaff
	git clean -fdx

PRE_HDKE_VERSION = whi_hdk_extensions = "=0.3.0"
NEW_HDKE_VERSION = whi_hdk_extensions = "=0.4.0"

PRE_HH_VERSION = "=0.2.1", features
NEW_HH_VERSION = "=0.2.2", features

GG_REPLACE_LOCATIONS = ':(exclude)*.lock' Cargo.toml tests/zomes/

update-hdk-version:
	git grep -l '$(PRE_HH_VERSION)' -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's|$(PRE_HH_VERSION)|$(NEW_HH_VERSION)|g'
	git grep -l '$(PRE_HDKE_VERSION)' -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's|$(PRE_HDKE_VERSION)|$(NEW_HDKE_VERSION)|g'
