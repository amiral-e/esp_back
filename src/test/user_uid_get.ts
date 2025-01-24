import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../middlewares/middleware_auth.ts";

const user_uid_get = new Hono();

user_uid_get.get('/',
	describeRoute({
		summary: 'Get connected user',
		description: 'This is a test route, it returns the connected user\'s uid',
		tags: ['debug'],
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
									description: 'The message',
								},
								user: {
									type: 'object',
									properties: {
										uid: {
											type: 'string',
											description: 'The user uid',
										},
									},
									required: ['uid'],
								},
							},
						},
					},
				},
			},
		},
	}),
	AuthMiddleware, async (c: any) => {
		const user = c.get('user');
		return c.json({
			message: "Here is your uid",
			user: user,
		});
	});

export default user_uid_get;
