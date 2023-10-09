[![](https://img.shields.io/npm/v/@spartan-hc/caps-entities/latest?style=flat-square)](http://npmjs.com/package/@spartan-hc/caps-entities)

# CAPS Entities
A library for transforming Entity objects for the [`hc_crud_caps`](https://docs.rs/hc_crud_caps/) rust crate.

[![](https://img.shields.io/github/issues-raw/spartan-holochain-counsel/rust-hc-crud-caps?style=flat-square)](https://github.com/spartan-holochain-counsel/rust-hc-crud-caps/issues)
[![](https://img.shields.io/github/issues-closed-raw/spartan-holochain-counsel/rust-hc-crud-caps?style=flat-square)](https://github.com/spartan-holochain-counsel/rust-hc-crud-caps/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/spartan-holochain-counsel/rust-hc-crud-caps?style=flat-square)](https://github.com/spartan-holochain-counsel/rust-hc-crud-caps/pulls)


## Install

```bash
npm i @spartan-hc/caps-entities
```

## Basic Usage

```js
import crypto from 'crypto';
import { ActionHash, EntryHash } from '@spartan-hc/holo-hash';
import { Entity } from '@spartan-hc/caps-entities';

const post = new Entity({
    "id": new ActionHash( crypto.randomBytes(32) ),
    "action": new ActionHash( crypto.randomBytes(32) ),
    "address": new EntryHash( crypto.randomBytes(32) ),
    "type": "post",
    "content": {
	"message": "Goodbye, world!",
	"published_at": 1696819762583,
	"last_updated": 1696819762602
    }
});

console.log( post );
// Entity {
//     message: 'Goodbye, world!',
//     published_at: 1696819762583,
//     last_updated: 1696819762602
// }

// Hidden properties
console.log( post.$id );        // ActionHash( ... );
console.log( post.$action );    // ActionHash( ... );
console.log( post.$address );   // EntryHash( ... );
console.log( post.$type );      // "post"
```
