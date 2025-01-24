import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'bun:test';
import admin from './index.ts';

import envVars from '../config_test.ts';

import { insertAdmin, deleteAdmin } from './utils.ts';

afterAll(async () => {
  await deleteAdmin(envVars.DUMMY_ID);
  await deleteAdmin(envVars.DUMMY_ID_2);
});

describe('POST /admins (without privileges)', () => {
  beforeEach(async () => {
    await deleteAdmin(envVars.DUMMY_ID);
  })

  it('missing authorization header', async () => {
    const res = await admin.request('/', {
      method: 'POST',
    })
    expect(await res.json()).toEqual({
      error: 'No authorization header found',
    })
    expect(res.status).toBe(401)
  })

  it('invalid authorization header', async () => {
    const res = await admin.request('/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer wrong-header` },
    })
    expect(await res.json()).toEqual({
      error: 'Invalid authorization header',
    })
    expect(res.status).toBe(401)
  })

  it('non-user authorization header', async () => {
    const res = await admin.request('/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${envVars.WRONG_JWT_PAYLOAD}` },
    })
    expect(await res.json()).toEqual({
      error: 'Uid not found',
    })
    expect(res.status).toBe(404)
  })

  it('correct authorization header', async () => {
    const res = await admin.request('/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
    })
    expect(await res.json()).toEqual({
      error: 'You don\'t have admin privileges',
    })
    expect(res.status).toBe(401)
  })
});

describe('POST /admins (with privileges)', () => {
  beforeEach(async () => {
    await insertAdmin(envVars.DUMMY_ID);
    await deleteAdmin(envVars.DUMMY_ID_2);
  })

  it('invalid JSON', async () => {
    const res = await admin.request('/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
    })
    expect(await res.json()).toEqual({
      error: 'Invalid JSON',
    })
    expect(res.status).toBe(400)
  })

  it('yourself', async () => {
    const res = await admin.request('/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
      body: JSON.stringify({ user_id: envVars.DUMMY_ID }),
    })
    expect(await res.json()).toEqual({
      error: 'You can\'t add yourself to admins',
    })
    expect(res.status).toBe(400)
  })

  it('non-user', async () => {
    await insertAdmin(envVars.DUMMY_ID_2);
    const res = await admin.request('/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
      body: JSON.stringify({ user_id: "non-user" }),
    })
    expect(await res.json()).toEqual({
      error: 'User not found',
    })
    expect(res.status).toBe(404)
  })

  it('admin user', async () => {
    await insertAdmin(envVars.DUMMY_ID_2);
    const res = await admin.request('/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
      body: JSON.stringify({ user_id: envVars.DUMMY_ID_2 }),
    })
    expect(await res.json()).toEqual({
      error: 'User is already an admin',
    })
    expect(res.status).toBe(400)
  })

  it('non-admin user', async () => {
    const res = await admin.request('/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
      body: JSON.stringify({ user_id: envVars.DUMMY_ID_2 }),
    })
    expect(await res.json()).toEqual({
      message: `User ${envVars.DUMMY_ID_2} added to admins`,
    })
    expect(res.status).toBe(200)
  })
})