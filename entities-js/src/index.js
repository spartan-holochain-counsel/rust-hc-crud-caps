import {
    ActionHash, EntryHash,
}					from '@spartan-hc/holo-hash';
import {
    intoStruct,
    OptionType, VecType, MapType,
}					from '@whi/into-struct';
import {
    set_tostringtag,
    define_hidden_prop,
}					from './utils.js';


export class Entity {
    static REQUIRED_PROPERTIES		= ["id", "action", "address", "type", "content"];

    constructor ( data ) {
	if ( Entity.REQUIRED_PROPERTIES.map(key => typeof data[key]).includes("undefined") )
	    throw new TypeError(`Entity data is missing one of the required properties (${Entity.REQUIRED_PROPERTIES})`);

	if ( typeof data.type !== "string"  )
	    throw new TypeError(`Entity expects [type] to be a string; not type '${typeof data.type}'`);

	if ( typeof data.content !== "object" || data.content === null )
	    throw new TypeError(`Entity content cannot be a primitive value; found content (${typeof data.content}): ${data.content}`);

	if ( this.constructor.STRUCT )
	    data.content		= intoStruct( data.content, this.constructor.STRUCT );

	Object.assign( this, data.content );

	let $id				= new ActionHash(data.id);
	let $action			= new ActionHash(data.action);
	let $addr			= new EntryHash(data.address);

	define_hidden_prop( this, "$id",	$id );
	define_hidden_prop( this, "$action",	$action );
	define_hidden_prop( this, "$address",	$addr );
	define_hidden_prop( this, "$addr",	$addr ); // alias to $address
	define_hidden_prop( this, "$type",	data.type );
    }

    toJSON () {
	return {
	    "id":	this.$id.toString(),
	    "action":	this.$action.toString(),
	    "address":	this.$address.toString(),
	    "type":	this.$type,
	    "content":	Object.assign( {}, this ),
	};
    }
}
set_tostringtag( Entity );


// # ScopedEntity
// Allow the entity to make Zomelet calls by connecting the scoped zomelet
//
// - Is aware of the scoped zomelet so it can make other calls
// - When constructed it expects to be passed the 'scoped_zome'
//
export class ScopedEntity extends Entity {
    #zome				= null;

    constructor ( entity, scoped_zome ) {
	if ( scoped_zome?.constructor?.name === "CallContext" )
	    scoped_zome			= scoped_zome.zome;

	if ( scoped_zome?.constructor?.name !== "ScopedZomelet" )
	    throw new TypeError(`Expected instance of ScopedZomelet for arg #2; not type '${scoped_zome.constructor.name}'`);

	super( entity );

	if ( typeof scoped_zome === undefined )
	    throw new TypeError(`Missing 'scoped_zome' arg for entity extension class '${this.constructor.name}'`);

	this.#zome			= scoped_zome;
    }

    // Only expose peer functions because we don't want functionality defined here when it should
    // be defined in the Zomelet.
    get zome () {
	return this.#zome.functions;
    }

    toJSON ( context = false ) {
	return context === true
	    ? super.toJSON()
	    : super.toJSON().content;
    }
};
set_tostringtag( ScopedEntity );


export *			from '@whi/into-struct';

export default {
    Entity,
    ScopedEntity,
    intoStruct,
    OptionType, VecType, MapType,
}
