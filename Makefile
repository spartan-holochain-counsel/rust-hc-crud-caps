
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
DEBUG_LEVEL	       ?= warn
TEST_ENV_VARS		= LOG_LEVEL=$(DEBUG_LEVEL)
MOCHA_OPTS		= -n enable-source-maps

%/package-lock.json:		%/package.json
	touch $@
%/node_modules:			%/package-lock.json
	cd $*; npm install
	touch $@
test-setup:			tests/node_modules

test:
	make -s test-unit-debug
	make -s test-integration

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
	cd tests; $(TEST_ENV_VARS) npx mocha $(MOCHA_OPTS) integration/test_basic.js



#
# Packages
#
preview-crate:			test-debug
	cargo publish --dry-run --allow-dirty
publish-crate:			test-debug .cargo/credentials
	make docs
	cargo publish
.cargo/credentials:
	cp ~/$@ $@



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

PRE_HDKE_VERSION = whi_hdk_extensions = "0.5"
NEW_HDKE_VERSION = whi_hdk_extensions = "0.6"

PRE_HH_VERSION = "0.2.6", features
NEW_HH_VERSION = "0.3.0-beta-dev.24", features

GG_REPLACE_LOCATIONS = ':(exclude)*.lock' Cargo.toml tests/zomes/

update-hdk-version:
	git grep -l '$(PRE_HH_VERSION)' -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's|$(PRE_HH_VERSION)|$(NEW_HH_VERSION)|g'
	git grep -l '$(PRE_HDKE_VERSION)' -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's|$(PRE_HDKE_VERSION)|$(NEW_HDKE_VERSION)|g'



#
# Documentation
#
MAIN_DOCS		= target/doc/hdk_extensions/index.html
test-docs:
	cargo test --doc
$(MAIN_DOCS):		test-docs
	cargo doc
	@echo -e "\x1b[37mOpen docs in file://$(shell pwd)/$(MAIN_DOCS)\x1b[0m";
docs:			$(MAIN_DOCS)
docs-watch:
	@inotifywait -r -m -e modify		\
		--includei '.*\.rs'		\
			src/			\
	| while read -r dir event file; do	\
		echo -e "\x1b[37m$$event $$dir$$file\x1b[0m";\
		make docs;			\
	done



#
# NPM packaging
#
prepare-entities-package:			entities-js/node_modules
	cd entities-js; rm -f dist/*
	cd entities-js; npx webpack
	cd entities-js; MODE=production npx webpack
	cd entities-js; gzip -kf dist/*.js
	cd entities-js; npm i
preview-entities-package:	clean-files test prepare-entities-package
	cd entities-js; npm pack --dry-run .
create-entities-package:	clean-files test prepare-entities-package
	cd entities-js; npm pack .
publish-entities-package:	clean-files test prepare-entities-package
	cd entities-js; npm publish --access public .
