import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'bun:test';
import response_post from './response_post';
import config from '../../config';
import envVars from '../../config_test';
import { deleteAdmin, insertAdmin } from '../../admins/utils';

describe('POST /forum/response', () => {

    describe('Response creation tests', () => {
        it('invalid JSON body', async () => {
            const res = await response_post.request(`/`,  {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` }
            });
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data).toEqual({ error: "Invalid JSON body" });
        });
    
        it('missing message in body', async () => {
            const res = await response_post.request(`/`,  {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data).toEqual({ error: "Message is required" });
        });
    
        it('successful response creation', async () => {
            const testMessage = 'Test response message';
            
            const res = await response_post.request(`/`,  {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: testMessage })
            });
    
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toHaveProperty('id');
            expect(data?.message).toBe(testMessage);
            expect(data?.user_id).toBe(envVars.DUMMY_ID);
            // delete response for dynamique id
            await config.supabaseClient
            .from("responses")
            .delete()
            .eq('id', data.id);
        });
    });
    
});
