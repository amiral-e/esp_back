import { decode, sign, verify } from 'hono/jwt'
import config from './config.ts';

const AuthMiddleware = async (c: any, next: any) => {
	const { authorization } = c.req.header();
	if (!authorization)
		return c.json({ error: 'No authorization header found' }, 401);
	const bearer = authorization.replace('Bearer ', '');
	try {
		const decoded = await verify(bearer, config.envVars.JWT_SECRET);
		if (!decoded || !decoded['uid'])
			return c.json({ error: 'Invalid authorization header' }, 401);
		const { data, error } = await config.supabaseClient.rpc('check_uid_exists', { uid: decoded['uid'] });
		if (error)
			return c.json({ error: error.message }, 500);
		c.set('user', decoded);
		return next();
	} catch (error) {
		return c.json({ error: 'Invalid authorization header' }, 401);
	}
};

export default AuthMiddleware;