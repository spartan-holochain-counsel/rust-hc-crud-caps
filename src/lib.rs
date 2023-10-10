//! Other Resources
//!
//! - Source code - [github.com/spartan-holochain-counsel/rust-hc-crud-caps](https://github.com/spartan-holochain-counsel/rust-hc-crud-caps/)
//! - Cargo package - [crates.io/crates/hc_crud_caps](https://crates.io/crates/hc_crud_caps)
//!

mod entities;
mod utils;

pub use hdk_extensions::hdi;
pub use hdk_extensions::hdi_extensions;
pub use hdk_extensions::hdk;
pub use hdk_extensions;

use std::convert::TryFrom;
use hdk::prelude::*;
use hdi_extensions::{
    summon_create_action,
    trace_origin_root,
};
use hdk_extensions::{
    must_get,
    follow_evolutions,
};

pub use entities::{
    Entity, EntityId,
    EmptyEntity, EntryModel,
};
pub use utils::{
    now,
    to_entry_type,
};


#[derive(Debug, Serialize, Deserialize)]
pub struct GetEntityInput {
    pub id: ActionHash,
}

impl Into<GetEntityInput> for ActionHash {
    fn into(self) -> GetEntityInput {
	GetEntityInput {
	    id: self,
	}
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateEntityInput<T> {
    pub base: ActionHash,
    pub properties: T,
}

impl<T> UpdateEntityInput<T> {
    pub fn new(base: ActionHash, properties: T) -> Self {
	UpdateEntityInput { base, properties }
    }
}



/// Create a new entity
pub fn create_entity<T,I,E>(entry: &T) -> ExternResult<Entity<T>>
where
    ScopedEntryDefIndex: for<'a> TryFrom<&'a I, Error = WasmError>,
    EntryVisibility: for<'a> From<&'a I>,
    Entry: TryFrom<I, Error = E>,
    Entry: TryFrom<T, Error = E>,
    WasmError: From<E>,
    T: Clone + EntryModel<I>,
{
    let entry_hash = hash_entry( entry.to_owned() )?;
    let action_hash = create_entry( entry.to_input() )?;

    Ok(Entity {
	id: action_hash.to_owned(),
	address: entry_hash,
	action: action_hash,
	ctype: entry.get_type(),
	content: entry.to_owned(),
    })
}

/// Get an entity by its ID
pub fn get_entity<I,ET>(id: &ActionHash) -> ExternResult<Entity<I>>
where
    I: TryFrom<Record, Error = WasmError> + Clone + EntryModel<ET>,
    Entry: TryFrom<I, Error = WasmError>,
    ScopedEntryDefIndex: for<'a> TryFrom<&'a ET, Error = WasmError>,
{
    // Check if ID record has been deleted
    must_get( id )?;
    // ID must be a Create action
    summon_create_action( id )?;

    let latest_addr = follow_evolutions( &id )?.last().unwrap().to_owned();
    let record = must_get( &latest_addr )?;
    let content : I = to_entry_type( record.clone() )?;
    let address = record
	.action()
	.entry_hash().unwrap(); // to_entry_type would have failed if there was not entry

    Ok(Entity {
	id: id.to_owned(),
	action: record.action_address().to_owned(),
	address: address.to_owned(),
	ctype: content.get_type(),
	content: content,
    })
}

/// Update an entity
pub fn update_entity<T,I,F,E>(addr: &ActionHash, callback: F) -> ExternResult<Entity<T>>
where
    ScopedEntryDefIndex: for<'a> TryFrom<&'a I, Error = WasmError>,
    Entry: TryFrom<I, Error = E>,
    Entry: TryFrom<T, Error = E>,
    WasmError: From<E>,
    T: TryFrom<Record, Error = WasmError>,
    T: Clone + EntryModel<I>,
    F: FnOnce(T, Record) -> ExternResult<T>,
{
    // TODO: provide automatic check that the given address is the latest one or an optional flag
    // to indicate the intension to branch from an older update.
    let (id,_) = trace_origin_root( &addr )?;
    let record = must_get( addr )?;

    let current : T = to_entry_type( record.clone() )?;
    let updated_entry = callback( current, record.clone() )?;

    let entry_hash = hash_entry( updated_entry.to_owned() )?;
    let action_hash = update_entry( addr.clone(), updated_entry.to_input() )?;

    Ok(Entity {
	id: id,
	action: action_hash,
	address: entry_hash,
	ctype: updated_entry.get_type(),
	content: updated_entry,
    })
}

/// Delete an entity
pub fn delete_entity<T,ET>(id: &ActionHash) -> ExternResult<ActionHash>
where
    T: TryFrom<Record, Error = WasmError> + Clone + EntryModel<ET>,
    Entry: TryFrom<T, Error = WasmError>,
    ScopedEntryDefIndex: for<'a> TryFrom<&'a ET, Error = WasmError>,
{
    // ID must be a Create action
    summon_create_action( &id )?;

    let record = must_get( id )?;
    let _ : T = to_entry_type( record.clone() )?;
    debug!("Deleting record of Entity ID: {}", id );
    let delete_hash = delete_entry( id.to_owned() )?;

    Ok( delete_hash )
}


/// Get multiple entities for a given base and link tag filter
pub fn get_entities<T,LT,ET,B>(id: &B, link_type: LT, tag: Option<Vec<u8>>) -> ExternResult<Vec<Entity<T>>>
where
    T: TryFrom<Record, Error = WasmError> + Clone + EntryModel<ET>,
    B: Into<AnyLinkableHash> + Clone,
    LT: LinkTypeFilterExt,
    Entry: TryFrom<T, Error = WasmError>,
    ScopedEntryDefIndex: for<'a> TryFrom<&'a ET, Error = WasmError>,
{
    let links = get_links(
        id.to_owned().into(),
	link_type,
	tag.map( |tag| LinkTag::new( tag ) )
    )?;

    debug!("get_entities for {} links: {:#?}", links.len(), links );
    let list = links.into_iter()
	.filter_map(|link| {
            debug!("Get entity for ID: {:?}", link.target );
	    link.target.into_action_hash()
		.and_then( |target| get_entity( &target ).ok() )
	})
	.collect();

    Ok(list)
}
