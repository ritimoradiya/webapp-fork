const request = require('supertest');
const app = require('../src/app');

describe('Health Check API - GET /healthz', () => {
  
  // Positive Test: Successful health check
  test('should return 200 OK for valid health check', async () => {
    const response = await request(app)
      .get('/healthz');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
    expect(response.body).toEqual({});
  });

  // Negative Test: Payload not allowed
  test('should return 400 Bad Request when payload is provided', async () => {
    const response = await request(app)
      .get('/healthz')
      .send({ some: 'data' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({});
  });

  // Negative Test: Wrong HTTP method - POST
  test('should return 405 Method Not Allowed for POST', async () => {
    const response = await request(app)
      .post('/healthz');

    expect(response.status).toBe(405);
    expect(response.body).toEqual({});
  });

  // Negative Test: Wrong HTTP method - PUT
  test('should return 405 Method Not Allowed for PUT', async () => {
    const response = await request(app)
      .put('/healthz');

    expect(response.status).toBe(405);
    expect(response.body).toEqual({});
  });

  // Negative Test: Wrong HTTP method - DELETE
  test('should return 405 Method Not Allowed for DELETE', async () => {
    const response = await request(app)
      .delete('/healthz');

    expect(response.status).toBe(405);
    expect(response.body).toEqual({});
  });

  // Negative Test: Wrong HTTP method - PATCH
  test('should return 405 Method Not Allowed for PATCH', async () => {
    const response = await request(app)
      .patch('/healthz');

    expect(response.status).toBe(405);
    expect(response.body).toEqual({});
  });
});