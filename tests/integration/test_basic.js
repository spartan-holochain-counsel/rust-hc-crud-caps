import { Logger }			from '@whi/weblogger';
const log				= new Logger("test-basic", process.env.LOG_LEVEL );

import fs				from 'fs';
import path				from 'path';
import { expect }			from 'chai';
import { Holochain }			from '@spartan-hc/holochain-backdrop';
import { HoloHash }			from '@spartan-hc/holo-hash';
import json				from '@whi/json';
// const why				= require('why-is-node-running');

import HolochainClient			from '@whi/holochain-client';
const { RibosomeError }			= HolochainClient;

import { schema }			from './setup.js';

const delay				= (n) => new Promise(f => setTimeout(f, n));
const DNA_PATH				= new URL( "../dnas/happy_path.dna", import.meta.url ).pathname;


async function expect_reject ( cb, error, message ) {
    let failed				= false;
    try {
	await cb();
    } catch (err) {
	failed				= true;
	expect( () => { throw err }	).to.throw( error, message );
    }
    expect( failed			).to.be.true;
}


let client;
let actors;
let post, post2;
let comment, comment2;
let create_post_input			= {
    "message": "Hello, world!",
};
let create_comment_input_1		= {
    "message": "Don't call me surely",
};
let create_comment_input_2		= {
    "message": "I've never been on a plane before",
};


function basic_tests () {
    it("should test 'create_entity'", async function () {
	post				= await client.call( "happy_path", "happy_path", "create_post", create_post_input );
	// log.trace("%s", json.debug(post) )

	expect( post.message		).to.equal( create_post_input.message );

	post2				= await client.call( "happy_path", "happy_path", "create_post", create_post_input );
	// log.trace("%s", json.debug(post2) )
    });

    it("should test 'get_entity'", async function () {
	post				= await client.call( "happy_path", "happy_path", "get_post", {
	    "id": post.$id,
	});
	log.trace("%s", json.debug(post) )

	expect( post.message		).to.equal( create_post_input.message );
    });

    it("should test 'update_entity'", async function () {
	let input			= Object.assign( {}, create_post_input, {
	    "message": "Goodbye, world!",
	});

	let prev_post			= post2;
	post2				= await client.call( "happy_path", "happy_path", "update_post", {
	    "base": post2.$action,
	    "properties": input,
	});
	// log.trace("%s", json.debug(post2) )

	expect( post2.message		).to.equal( input.message );
	expect( post2.$action		).to.not.deep.equal( prev_post.$action );

	post2				= await client.call( "happy_path", "happy_path", "get_post", {
	    "id": post2.$id,
	});
	// log.trace("%s", json.debug(post2) )

	expect( post2.message		).to.equal( input.message );
	expect( post2.$action		).to.not.deep.equal( prev_post.$action );
    });

    it("should test 'Collection'", async function () {
	this.timeout( 5_000 );
	{
	    create_comment_input_1.for_post = post.$id;
	    comment			= await client.call( "happy_path", "happy_path", "create_comment", {
		"post_id": post.$id,
		"comment": create_comment_input_1,
	    });

	    expect( comment.message		).to.equal( create_comment_input_1.message );
	    expect( comment.for_post		).to.deep.equal( post.$id );

	    create_comment_input_2.for_post = post2.$id;
	    comment2			= await client.call( "happy_path", "happy_path", "create_comment", {
		"post_id": post2.$id,
		"comment": create_comment_input_2,
	    });
	}

	{
	    comment			= await client.call( "happy_path", "happy_path", "get_comment", {
		"id": comment.$id,
	    });

	    expect( comment.message		).to.equal( create_comment_input_1.message );
	    expect( comment.for_post		).to.deep.equal( post.$id );
	}

	{
	    let comments		= await client.call( "happy_path", "happy_path", "get_comments_for_post", post.$id );

	    expect( comments		).to.have.length( 1 );
	}

	{
	    let comments		= await client.call( "happy_path", "happy_path", "get_comments_by_agent", client.cellAgent() );

	    expect( comments		).to.have.length( 2 );
	}

	{
	    let input			= Object.assign( {}, create_comment_input_1, {
		"message": "I just want to tell you both, good luck. We're all counting on you.",
	    });

	    let prev_comment		= comment;
	    comment			= await client.call( "happy_path", "happy_path", "update_comment", {
		"base": comment.$action,
		"properties": input,
	    });

	    expect( comment.$action	).to.not.deep.equal( prev_comment.$action );

	    let comments		= await client.call( "happy_path", "happy_path", "get_comments_for_post", post.$id );

	    expect( comments		).to.have.length( 1 );
	    expect( comments[0].message	).to.equal( input.message );
	    expect( comments[0].$action	).to.not.deep.equal( prev_comment.$action );
	}

	{
	    await client.call( "happy_path", "happy_path", "link_comment_to_post", {
		"comment_id": comment.$id,
		"post_id": post2.$id,
	    });

	    let comments		= await client.call( "happy_path", "happy_path", "get_comments_for_post", post2.$id );

	    expect( comments		).to.have.length( 2 );
	}

	{
	    comment			= await client.call( "happy_path", "happy_path", "move_comment_to_post", {
		"comment_action": comment.$action,
		"post_id": post2.$id,
	    });

	    expect( comment.for_post	).to.not.deep.equal( post.$id );

	    let comments		= await client.call( "happy_path", "happy_path", "get_comments_for_post", post.$id );

	    expect( comments		).to.have.length( 0 );

	    let comments2		= await client.call( "happy_path", "happy_path", "get_comments_for_post", post2.$id );

	    expect( comments2		).to.have.length( 2 );
	}

	{
	    let delete_hash		= await client.call( "happy_path", "happy_path", "delete_comment", {
		"id": comment.$id,
	    });

	    let comments		= await client.call( "happy_path", "happy_path", "get_comments_for_post", post2.$id );
	    log.trace("%s", json.debug(comments) )

	    expect( comments		).to.have.length( 1 );
	}
    });

    it("should test 'delete_entity'", async function () {
	let delete_hash			= await client.call( "happy_path", "happy_path", "delete_post", {
	    "id": post.$id,
	});

	expect( delete_hash		).to.be.a("ActionHash");
    });
}

function errors_tests () {
    it("should fail to 'get_entity' because base is wrong entry type", async function () {
	await expect_reject( async () => {
	    let resp = await client.call( "happy_path", "happy_path", "get_post", {
		"id": comment2.$id,
	    });
	}, "Deserialized entry to wrong type: expected 0/0 but found 0/1" );
    });

    it("should fail to update because of wrong entry type", async function () {
	await expect_reject( async () => {
	    await client.call( "happy_path", "happy_path", "update_comment", {
		"base": post2.$action,
		"properties": create_comment_input_1,
	    });
	}, "Serialize(Deserialize(\"missing field `for_post`\"))" );
    });

    it("should fail to update because mismatched type", async function () {
	await expect_reject( async () => {
	    await client.call( "happy_path", "happy_path", "update_post", {
		"base": comment2.$action,
		"properties": create_post_input,
	    });
	}, "Deserialized entry to wrong type: expected 0/0 but found 0/1" );
    });

    it("should fail to create comment because post is deleted", async function () {
	await expect_reject( async () => {
	    await client.call( "happy_path", "happy_path", "create_comment", {
		"post_id": post.$id,
		"comment": create_comment_input_1,
	    });
	}, "Record not found @ address" );
    });

    it("should fail to delete because wrong type", async function () {
	await expect_reject( async () => {
	    await client.call( "happy_path", "happy_path", "delete_comment", {
		"id": post2.$id,
	    });
	}, "Serialize(Deserialize(\"missing field `for_post`\"))" );
    });

    it("should fail to delete because mismatched type", async function () {
	await expect_reject( async () => {
	    await client.call( "happy_path", "happy_path", "delete_post", {
		"id": comment2.$id,
	    });
	}, "Deserialized entry to wrong type: expected 0/0 but found 0/1" );
    });

    it("should fail to get because base is an 'update', not an 'origin' entry", async function () {
	await expect_reject( async () => {
	    await client.call( "happy_path", "happy_path", "get_post", {
		"id": post2.$action,
	    });
	}, "is not a Create record" );
    });
}

describe("CAPS", () => {
    const holochain			= new Holochain({
	"default_stdout_loggers": process.env.LOG_LEVEL === "trace",
    });

    before(async function () {
	this.timeout( 30_000 );

	const actors			= await holochain.backdrop({
	    "test_happ": {
		"happy_path": DNA_PATH,
	    },
	}, {
	    "timeout": 30_000,
	});

	client				= actors.alice.test_happ.client;

	client.addProcessor("output", response => {
	    // log.trace("%s", response );
	    try {
		return schema.deconstruct("entity", response );
	    }
	    catch (err) {
	    }

	    try {
		return response.map( entity => schema.deconstruct( "entity", entity ) );
	    }
	    catch (err) {
	    }

	    try {
		return new HoloHash( response );
	    }
	    catch (err) {
	    }

	    log.trace("%s", response );
	    return response;
	});
    });

    describe("Basic", basic_tests.bind( this, holochain ) );
    describe("Errors", errors_tests.bind( this, holochain ) );

    after(async () => {
	await holochain.stop();
	await holochain.destroy();
    });

});
