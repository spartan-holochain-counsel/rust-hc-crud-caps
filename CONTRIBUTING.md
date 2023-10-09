[back to README.md](README.md)

# Contributing

## Overview
This package is designed to work with Holochain's Conductor API interfaces.


## Development

### Environment

- Enter `nix-shell` for other development environment dependencies.

### Building
This is a library, not a binary.  No build required

#### Crate Documentation

```
make docs
```


### Release Process
Each release involves

1. (if changed) Publishing the `hc_crud_caps` crate
2. (if changed) Publishing the `@spartan-hc/caps-entities` NPM package


#### Publishing Crate

https://crates.io/crates/hc_crud_caps

```
make preview-crate
make publish-crate
```

### Publishing NPM Package

https://www.npmjs.com/package/@spartan-hc/caps-entities

```
make preview-entities-package
make publish-entities-package
```


### Testing

To run all tests with logging
```
make test-debug
```

- `make test-unit-debug` - **Unit tests only**
- `make test-integration-debug` - **Integration tests only**

> **NOTE:** remove `-debug` to run tests without logging
