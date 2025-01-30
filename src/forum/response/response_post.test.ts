import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'bun:test';
import responses from '..';
import config from '../../config';
import envVars from '../../config_test';
import { deleteAdmin, insertAdmin } from '../../admins/utils';
  
afterAll(async () => {
    await config.supabaseClient
      .from("responses")
      .delete()
      .neq('id', 0);
  });
  

describe('POST /response/', () => {

    
    describe('Response creation tests', () => {
        it('invalid JSON body', async () => {
            const res = await responses.request(`/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` }
            });
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data).toEqual({ error: "Invalid JSON body" });
        });
    
        it('missing message in body', async () => {
            const res = await responses.request(`/`, {
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
            
            const res = await responses.request(`/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: testMessage })
            });
    
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toHaveProperty('message');
        });
    });
    
});
