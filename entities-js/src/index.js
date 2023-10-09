import {
    ActionHash, EntryHash,
}					from '@spartan-hc/holo-hash';
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
	    "id":	this.$id.bytes(),
	    "action":	this.$action.bytes(),
	    "address":	this.$address.bytes(),
	    "type":	this.$type,
	    "content":	Object.assign( {}, this ),
	};
    }
}
set_tostringtag( Entity );


export default {
    Entity,
}
