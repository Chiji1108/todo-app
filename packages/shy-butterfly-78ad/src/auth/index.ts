import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { createSelectSchema } from 'drizzle-zod';
import type { MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { createRemoteJWKSet, importJWK, jwtVerify } from 'jose';
import { Bindings } from '..';
import * as schema from '../schema';

const selectUserSchema = createSelectSchema(schema.users, {
	id: (schema) => schema.id.openapi({ example: 'uuid' }),
	name: (schema) => schema.name.openapi({ example: 'John Doe' }),
})
	.omit({ googleId: true })
	.openapi('User');

export const authorize: MiddlewareHandler<{
	Bindings: Bindings;
	Variables: { userId: string };
}> = async (c, next) => {
	const sessionId = getCookie(c, 'session_id');
	if (!sessionId) return c.json({ message: 'unauthorized' }, { status: 401 });
	const session = await c.env.KV.get(`session:${sessionId}`);
	if (!session) return c.json({ message: 'unauthorized' }, { status: 401 });
	c.set('userId', JSON.parse(session).userId);
	await next();
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: { userId: string } }>()
	.openapi(
		createRoute({
			method: 'get',
			path: '/me',
			responses: {
				200: {
					content: {
						'application/json': {
							schema: selectUserSchema,
						},
					},
					description: 'Returns the current user',
				},
				401: {
					content: {
						'application/json': {
							schema: z.object({
								message: z.string(),
							}),
						},
					},
					description: 'Unauthorized',
				},
			},
			tags: ['auth'],
		}),
		async (c) => {
			const cookie = getCookie(c);
			console.log('cookie: ', cookie);
			const sessionId = getCookie(c, 'session_id');
			if (!sessionId) return c.json({ message: 'unauthorized' }, { status: 401 });
			const session = await c.env.KV.get(`session:${sessionId}`);
			if (!session) return c.json({ message: 'unauthorized' }, { status: 401 });
			return c.json(JSON.parse(session));
		}
	)
	.openapi(
		createRoute({
			method: 'post',
			path: '/signout',
			responses: {
				200: {
					content: {
						'application/json': {
							schema: z.object({
								ok: z.boolean(),
							}),
						},
					},
					description: 'Signs out the user',
				},
			},
			tags: ['auth'],
		}),
		async (c) => {
			const sessionId = getCookie(c, 'session_id');
			if (sessionId) {
				await c.env.KV.delete(`session:${sessionId}`);
				deleteCookie(c, 'session_id');
			}
			return c.json({ ok: true });
		}
	)
	.openapi(
		createRoute({
			method: 'post',
			path: '/google',
			request: {
				cookies: z.object({
					g_csrf_token: z.string(),
				}),
				body: {
					content: {
						'application/x-www-form-urlencoded': {
							schema: z.object({
								credential: z.string(),
								g_csrf_token: z.string(),
							}),
						},
					},
				},
			},
			responses: {
				401: {
					content: {
						'application/json': {
							schema: z.object({
								message: z.string(),
							}),
						},
					},
					description: 'Unauthorized',
				},
				500: {
					content: {
						'application/json': {
							schema: z.object({
								message: z.string(),
							}),
						},
					},
					description: 'Internal Server Error',
				},
				302: {
					description: 'Redirects to the home page',
				},
			},
			tags: ['auth'],
		}),
		async (c) => {
			const { credential, g_csrf_token: bodyToken } = c.req.valid('form');
			const { g_csrf_token: cookieToken } = c.req.valid('cookie');
			if (bodyToken !== cookieToken) {
				return c.json({ message: 'invalid csrf token' }, { status: 401 });
			}
			const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
			const { payload } = await jwtVerify(credential, JWKS);
			if (!payload.sub) return c.json({ message: 'invalid token' }, { status: 401 });
			const googleId = payload.sub;
			const name = payload.name as string | undefined;
			const db = drizzle(c.env.DB, { schema });
			const user =
				(await db.query.users.findFirst({ where: eq(schema.users.googleId, googleId) })) ??
				(await db.insert(schema.users).values({ googleId, name }).returning()).at(0);
			if (!user) return c.json({ message: 'failed to create user' }, { status: 500 });
			const sessionId = crypto.randomUUID();
			const ttl = 60 * 60 * 24 * 7;
			setCookie(c, 'session_id', sessionId, {
				httpOnly: true,
				secure: true,
				sameSite: 'Strict',
				maxAge: ttl,
			});
			await c.env.KV.put(`session:${sessionId}`, JSON.stringify({ userId: user.id, name: user.name }), { expirationTtl: ttl });
			c.header('Referrer-Policy', 'no-referrer-when-downgrade');
			c.header(
				'Content-Security-Policy-Report-Only',
				'script-src https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; connect-src https://accounts.google.com/gsi/;'
			);
			return c.redirect('http://localhost:8788');
		}
	);

export default app;
