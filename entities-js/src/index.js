import {
    ActionHash, EntryHash,
}					from '@spartan-hc/holo-hash';
import {
    intoStruct,
    OptionType, VecType, MapType,
}					from '@whi/into-struct';
import {
    set_tostringtag,
    in_heritage,
}					from './utils.js';


export class Entity {
    static REQUIRED_PROPERTIES		= ["id", "action", "address", "type", "content"];

    #id					= null;
    #action				= null;
    #address				= null;
    #type				= null;

    constructor ( data ) {
	if ( Entity.REQUIRED_PROPERTIES.map(key => typeof data[key]).includes("undefined") )
	    throw new TypeError(`Entity data is missing one of the required properties (${Entity.REQUIRED_PROPERTIES})`);

	set_tostringtag( this.constructor );

	Entity.prototype.$update.call( this, data );
    }

    get $id () {
	return this.#id;
    }

    get $action () {
	return this.#action;
    }

    get $address () {
	return this.#address;
    }

    get $addr () {
	return this.#address;
    }

    get $type () {
	return this.#type;
    }

    $update ( data ) {
	if ( in_heritage( data, "Entity" ) )
	    data			= Entity.prototype.toJSON.call( data );

	Entity.prototype.$updateContext.call( this, data );
	Entity.prototype.$updateContent.call( this, data.content );
    }

    $updateContext ( ctx ) {
	if ( typeof ctx.type !== "string"  )
	    throw new TypeError(`Entity expects [type] to be a string; not type '${typeof ctx.type}'`);

	this.#id			= new ActionHash( ctx.id );
	this.#action			= new ActionHash( ctx.action );
	this.#address			= new EntryHash( ctx.address );
	this.#type			= ctx.type;
    }

    $updateContent ( content ) {
	if ( typeof content !== "object" || content === null )
	    throw new TypeError(`Entity content cannot be a primitive value; found content (${typeof content}): ${content}`);

	if ( this.constructor.STRUCT )
	    content			= intoStruct( content, this.constructor.STRUCT );

	Object.assign( this, content );
    }

    toJSON () {
	return {
	    "id":	String( this.$id ),
	    "action":	String( this.$action ),
	    "address":	String( this.$address ),
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
	    throw new TypeError(`Expected instance of ScopedZomelet for arg #2; not type '${scoped_zome?.constructor?.name}'`);

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
