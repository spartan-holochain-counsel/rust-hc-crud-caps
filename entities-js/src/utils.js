
export function set_tostringtag ( cls, name ) {
    Object.defineProperty( cls, "name", {
	value: name || cls.name,
    });
    Object.defineProperty( cls.prototype, Symbol.toStringTag, {
	value: name || cls.name,
	enumerable: false,
    });
}

export function define_hidden_prop ( obj, key, value ) {
    if ( obj[key] === undefined ) {
	Object.defineProperty( obj, key, {
	    "value": value,
	    "writable": false,
	    "enumerable": false,
	    "configurable": false,
	});
    }
}

export default {
    set_tostringtag,
    define_hidden_prop,
};
