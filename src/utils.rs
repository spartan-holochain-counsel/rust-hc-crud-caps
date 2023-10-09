use crate::hdi_extensions;
use crate::hdk;

use hdk::prelude::*;
use hdi_extensions::{
    guest_error,
};
use crate::entities::{ EntryModel };


/// Get the current unix timestamp
pub fn now() -> ExternResult<u64> {
    sys_time()
	.map( |t| (t.as_micros() / 1000) as u64 )
}


/// Verify a Record's entry is the expected entry type
///
/// - `T` - the expected entry type
/// - `record` - a Record expected to have an App entry
///
/// An entry type check could fail because of:
///
/// - a deserializing error indicating that it is the wrong entry type
/// - a wront entry type error indicating that the successful deserialization was a coincidence
///
/// ```ignore
/// let entry : T = to_entry_type( &record, &expected_hash )?
/// ```
pub fn to_entry_type<T,ET>(record: Record) -> ExternResult<T>
where
    T: EntryModel<ET>,
    T: TryFrom<Record, Error = WasmError> + Clone,
    ScopedEntryDefIndex: for<'a> TryFrom<&'a ET, Error = WasmError>,
{
    let content = T::try_from( record.clone() )?;
    let scoped_def = ScopedEntryDefIndex::try_from( &content.to_input() )?;

    if let Some(EntryType::App(AppEntryDef {zome_index, entry_index, ..})) = record.action().entry_type() {
	if *zome_index == scoped_def.zome_index && *entry_index == scoped_def.zome_type {
	    Ok(content)
	}
	else {
	    Err(guest_error!(format!(
                "Deserialized entry to wrong type: expected {}/{} but found {}/{} (zome/entry)",
                scoped_def.zome_index, scoped_def.zome_type.0, zome_index, entry_index.0
            )))?
	}
    }
    else {
	Err(guest_error!(format!(
            "The Record @ {1} has the action type {0}; expected a Create or Update type",
            record.action_address().to_owned(), record.action().action_type()
        )))?
    }
}
