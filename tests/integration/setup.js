import { Logger }			from '@whi/weblogger';
const log				= new Logger("test-setup", process.env.LOG_LEVEL );

import { Architecture, EntityType }	from '@whi/entity-architect';
import { HoloHash }			from '@spartan-hc/holo-hash';


const PostEntity			= new EntityType("post", content => {
    content.published_at	= new Date( content.published_at );
    content.last_updated	= new Date( content.last_updated );
});

const CommentEntity			= new EntityType("comment", content => {
    content.for_post		= new HoloHash( content.for_post );
    content.published_at	= new Date( content.published_at );
    content.last_updated	= new Date( content.last_updated );
});

export const schema			= new Architecture([ PostEntity, CommentEntity ]);

export default {
    schema,
};
