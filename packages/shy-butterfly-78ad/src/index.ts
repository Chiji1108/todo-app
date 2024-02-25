import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
// import { OAuth2Client } from 'google-auth-library';
import { cors } from 'hono/cors';
import auth, { authorize } from './auth';
import todos from './todos';
// const client = new OAuth2Client();
export type Bindings = {
	DB: D1Database;
	KV: KVNamespace;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: { userId: string } }>()
	.doc('openapi.json', {
		openapi: '3.1.0',
		info: {
			version: '1.0.0',
			title: 'My API',
		},
	})
	// .use('/*', cors())
	.use('/todos/*', authorize)
	.route('/todos', todos)
	.route('/auth', auth)
	.get('/', swaggerUI({ url: 'openapi.json' }));

export default app;
