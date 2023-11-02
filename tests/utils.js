
export function linearSuite ( name, setup_fn, args_fn ) {
    describe( name, function () {
	beforeEach(function () {
	    let parent_suite		= this.currentTest.parent;
	    if ( parent_suite.tests.some(test => test.state === "failed") )
		this.skip();
	    if ( parent_suite.parent?.tests.some(test => test.state === "failed") )
		this.skip();
	});
	setup_fn.call( this, args_fn );
    });
}


export default {
    linearSuite,
};
