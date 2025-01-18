import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import admin from '../src/admins/index.ts';
import config from '../src/config.ts';

const DUMMY_JWT_PAYLOAD = process.env.DUMMY_JWT_PAYLOAD || '';
const DUMMY_ID = process.env.DUMMY_ID || '';

async function insertAdmin() {
  try {
    const { data, error } = await config.supabaseClient.from('admins').insert({ user_id: DUMMY_ID }).select('*').single();
    if (error != undefined)
      console.error(error.message);
  } catch (error) {
    console.error(error);
  }
}

async function deleteAdmin() {
  try {
    const { data, error } = await config.supabaseClient.from('admins').delete().eq('user_id', DUMMY_ID).select('*').single();
    if (error != undefined)
      console.error(error.message);
  } catch (error) {
    console.error(error);
  }
}

afterAll(async () => {
  await deleteAdmin();
});

beforeAll(async () => {
  await deleteAdmin();
});

describe('admin_delete route without privileges', () => {
  it('DELETE /admins without authorization', async () => {
    const res = await admin.request('/', {
      method: 'DELETE',
    })
    expect(await res.json()).toEqual({
      error: 'No authorization header found',
    })
    expect(res.status).toBe(401)
  })

  it('DELETE /admins without admin privileges', async () => {
    const res = await admin.request('/', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${DUMMY_JWT_PAYLOAD}` },
    })
    expect(await res.json()).toEqual({
      error: 'You don\'t have admin privileges',
    })
    expect(res.status).toBe(401)
  })
});


describe('admin_delete route with privileges', () => {
  it('DELETE /admins with invalid JSON', async () => {
    await insertAdmin();

    const res = await admin.request('/', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${DUMMY_JWT_PAYLOAD}` },
    })
    expect(await res.json()).toEqual({
      error: 'Invalid JSON',
    })
    expect(res.status).toBe(400)
  })

  it('DELETE /admins yourself', async () => {
    await insertAdmin();

    const res = await admin.request('/', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${DUMMY_JWT_PAYLOAD}` },
      body: JSON.stringify({ user_id: DUMMY_ID }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({
      error: 'You can\'t remove yourself from admins',
    })
  })

  // it('DELETE /admins', async () => {
  //   const res = await admin.request('/', {
  //     method: 'DELETE',
  //     headers: { 'Authorization': `Bearer ${DUMMY_JWT_TOKEN}` },
  //     body: JSON.stringify({ user_id: user_id }),
  //   })
  //   expect(res.status).toBe(200)
  //   expect(await res.json()).toEqual({
  //     message: `User ${user_id} removed from admins`,
  //   })
  // })

  // it('DELETE /admins with self-removal attempt', async () => {
  //   const res = await admin.request('/', {
  //     method: 'DELETE',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ user_id: 'self' }),
  //   })
  //   expect(res.status).toBe(401)
  //   expect(await res.json()).toEqual({
  //     error: "You can't remove yourself from admins",
  //   })
  // })

  // it('DELETE /admins with non-admin user', async () => {
  //   const res = await admin.request('/', {
  //     method: 'DELETE',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ user_id: 'non-admin' }),
  //   })
  //   expect(res.status).toBe(401)
  //   expect(await res.json()).toEqual({
  //     error: 'User is not an admin',
  //   })
  // })
})