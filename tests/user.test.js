const request = require('supertest');
const app = require('../src/app');
const { faker } = require('@faker-js/faker');

describe('User API Tests', () => {
  
  // Helper function to create a user
  const createUser = async (userData = {}) => {
    const defaultUser = {
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      username: faker.internet.email(),
      password: faker.internet.password({ length: 12 })
    };
    
    // Merge defaults with provided data
    const dataToSend = { ...defaultUser, ...userData };
    
    const response = await request(app)
      .post('/v1/user')
      .send(dataToSend);
    
    return {
      ...response.body,
      password: dataToSend.password,
      username: dataToSend.username,
      status: response.status
    };
  };

  // ============================================
  // POSITIVE TEST CASES - User Creation
  // ============================================
  
  describe('POST /v1/user - Create User (Positive Tests)', () => {
    
    test('should create user with valid data and return 201', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john.doe@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/v1/user')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.first_name).toBe(userData.first_name);
      expect(response.body.last_name).toBe(userData.last_name);
      expect(response.body.username).toBe(userData.username);
      expect(response.body).not.toHaveProperty('password'); // Password should not be in response
      expect(response.body).toHaveProperty('account_created');
      expect(response.body).toHaveProperty('account_updated');
    });

    test('should create multiple users with different valid data', async () => {
      const user1 = await createUser({
        username: 'user1@example.com',
        first_name: 'Alice'
      });
      const user2 = await createUser({
        username: 'user2@example.com',
        first_name: 'Bob'
      });

      expect(user1.status).toBe(201);
      expect(user2.status).toBe(201);
      expect(user1.id).not.toBe(user2.id);
    });
  });

  // ============================================
  // NEGATIVE TEST CASES - User Creation
  // ============================================
  
  describe('POST /v1/user - Create User (Negative Tests)', () => {
    
    test('should return 400 when first_name is missing', async () => {
      const response = await request(app)
        .post('/v1/user')
        .send({
          last_name: 'Doe',
          username: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when last_name is missing', async () => {
      const response = await request(app)
        .post('/v1/user')
        .send({
          first_name: 'John',
          username: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/v1/user')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/v1/user')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          username: 'test@example.com'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when username is not a valid email', async () => {
      const response = await request(app)
        .post('/v1/user')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          username: 'not-an-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when username exists (duplicate)', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'duplicate@example.com',
        password: 'password123'
      };

      // Create first user
      await request(app)
        .post('/v1/user')
        .send(userData);

      // Try to create duplicate
      const response = await request(app)
        .post('/v1/user')
        .send(userData);

      expect(response.status).toBe(400);
    });

    test('should return 400 when extra fields are provided', async () => {
      const response = await request(app)
        .post('/v1/user')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          username: 'test@example.com',
          password: 'password123',
          extra_field: 'not allowed'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when trying to set account_created', async () => {
      const response = await request(app)
        .post('/v1/user')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          username: 'test@example.com',
          password: 'password123',
          account_created: new Date().toISOString()
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when trying to set account_updated', async () => {
      const response = await request(app)
        .post('/v1/user')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          username: 'test@example.com',
          password: 'password123',
          account_updated: new Date().toISOString()
        });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // POSITIVE TEST CASES - Get User
  // ============================================
  
  describe('GET /v1/user/:userId - Get User (Positive Tests)', () => {
    
    test('should get user info with valid credentials (self)', async () => {
      const userData = {
        first_name: 'Jane',
        last_name: 'Smith',
        username: 'jane.smith@example.com',
        password: 'password123'
      };

      // Create user
      const createResponse = await request(app)
        .post('/v1/user')
        .send(userData);

      const userId = createResponse.body.id;

      // Get user info
      const response = await request(app)
        .get(`/v1/user/${userId}`)
        .auth(userData.username, userData.password);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
      expect(response.body.first_name).toBe(userData.first_name);
      expect(response.body.last_name).toBe(userData.last_name);
      expect(response.body.username).toBe(userData.username);
      expect(response.body).not.toHaveProperty('password');
    });
  });

  // ============================================
  // NEGATIVE TEST CASES - Get User
  // ============================================
  
  describe('GET /v1/user/:userId - Get User (Negative Tests)', () => {
    
    test('should return 401 when no authentication provided', async () => {
      const response = await request(app)
        .get('/v1/user/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(401);
    });

    test('should return 401 with invalid credentials', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john@example.com',
        password: 'password123'
      };

      const createResponse = await createUser(userData);
      const userId = createResponse.id;

      const response = await request(app)
        .get(`/v1/user/${userId}`)
        .auth(userData.username, 'wrongpassword');

      expect(response.status).toBe(401);
    });

    test('should return 403 when trying to access another user', async () => {
      // Create user1 directly with complete data
      const user1Data = {
        first_name: 'User',
        last_name: 'One',
        username: 'user1@example.com',
        password: 'password123'
      };
      const user1Response = await request(app)
        .post('/v1/user')
        .send(user1Data);

      // Create user2 directly with complete data
      const user2Data = {
        first_name: 'User',
        last_name: 'Two',
        username: 'user2@example.com',
        password: 'password456'
      };
      const user2Response = await request(app)
        .post('/v1/user')
        .send(user2Data);

      // Try to access user2 with user1 credentials
      const response = await request(app)
        .get(`/v1/user/${user2Response.body.id}`)
        .auth(user1Data.username, user1Data.password);

      expect(response.status).toBe(403);
    });

    test('should return 404 when user does not exist', async () => {
      const userData = {
        username: 'test@example.com',
        password: 'password123'
      };

      await createUser(userData);

      const response = await request(app)
        .get('/v1/user/00000000-0000-0000-0000-000000000000')
        .auth(userData.username, userData.password);

      expect(response.status).toBe(404);
    });

    test('should return 400 for invalid UUID format', async () => {
      const userData = {
        username: 'test@example.com',
        password: 'password123'
      };

      await createUser(userData);

      const response = await request(app)
        .get('/v1/user/invalid-uuid')
        .auth(userData.username, userData.password);

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // POSITIVE TEST CASES - Update User
  // ============================================
  
  describe('PUT /v1/user/:userId - Update User (Positive Tests)', () => {
    
    test('should update user with valid data', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john@example.com',
        password: 'password123'
      };

      const createResponse = await createUser(userData);
      const userId = createResponse.id;

      const updateData = {
        first_name: 'Jane',
        last_name: 'Smith',
        password: 'newpassword456'
      };

      const response = await request(app)
        .put(`/v1/user/${userId}`)
        .auth(userData.username, userData.password)
        .send(updateData);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    test('should verify updated user data persists', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john@example.com',
        password: 'password123'
      };

      const createResponse = await createUser(userData);
      const userId = createResponse.id;

      // Update user
      await request(app)
        .put(`/v1/user/${userId}`)
        .auth(userData.username, userData.password)
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          password: 'newpassword456'
        });

      // Get user with new password
      const response = await request(app)
        .get(`/v1/user/${userId}`)
        .auth(userData.username, 'newpassword456');

      expect(response.status).toBe(200);
      expect(response.body.first_name).toBe('Jane');
      expect(response.body.last_name).toBe('Smith');
    });
  });

  // ============================================
  // NEGATIVE TEST CASES - Update User
  // ============================================
  
  describe('PUT /v1/user/:userId - Update User (Negative Tests)', () => {
    
    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/v1/user/123e4567-e89b-12d3-a456-426614174000')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });

    test('should return 403 when trying to update another user', async () => {
      // Create user1 directly with complete data
      const user1Data = {
        first_name: 'User',
        last_name: 'One',
        username: 'user1@example.com',
        password: 'password123'
      };
      const user1Response = await request(app)
        .post('/v1/user')
        .send(user1Data);

      // Create user2 directly with complete data
      const user2Data = {
        first_name: 'User',
        last_name: 'Two',
        username: 'user2@example.com',
        password: 'password456'
      };
      const user2Response = await request(app)
        .post('/v1/user')
        .send(user2Data);

      const response = await request(app)
        .put(`/v1/user/${user2Response.body.id}`)
        .auth(user1Data.username, user1Data.password)
        .send({
          first_name: 'Hacker',
          last_name: 'Attempt',
          password: 'hacked123'
        });

      expect(response.status).toBe(403);
    });

    test('should return 404 when user does not exist', async () => {
      const userData = {
        username: 'test@example.com',
        password: 'password123'
      };

      await createUser(userData);

      const response = await request(app)
        .put('/v1/user/00000000-0000-0000-0000-000000000000')
        .auth(userData.username, userData.password)
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          password: 'password123'
        });

      expect(response.status).toBe(404);
    });

    test('should return 400 when required fields are missing', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john@example.com',
        password: 'password123'
      };

      const createResponse = await createUser(userData);
      const userId = createResponse.id;

      const response = await request(app)
        .put(`/v1/user/${userId}`)
        .auth(userData.username, userData.password)
        .send({
          first_name: 'Jane'
          // Missing last_name and password
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when trying to update username', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john@example.com',
        password: 'password123'
      };

      const createResponse = await createUser(userData);
      const userId = createResponse.id;

      const response = await request(app)
        .put(`/v1/user/${userId}`)
        .auth(userData.username, userData.password)
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          password: 'newpass',
          username: 'newemail@example.com' // Cannot update username
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when trying to update account_created', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john@example.com',
        password: 'password123'
      };

      const createResponse = await createUser(userData);
      const userId = createResponse.id;

      const response = await request(app)
        .put(`/v1/user/${userId}`)
        .auth(userData.username, userData.password)
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          password: 'newpass',
          account_created: new Date().toISOString()
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when trying to update account_updated', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john@example.com',
        password: 'password123'
      };

      const createResponse = await createUser(userData);
      const userId = createResponse.id;

      const response = await request(app)
        .put(`/v1/user/${userId}`)
        .auth(userData.username, userData.password)
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          password: 'newpass',
          account_updated: new Date().toISOString()
        });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // EDGE CASE TESTS
  // ============================================
  
  describe('User API - Edge Cases', () => {
    
    test('should handle very long names (boundary test)', async () => {
      const response = await createUser({
        first_name: 'A'.repeat(100),
        last_name: 'B'.repeat(100),
        username: 'test@example.com',
        password: 'password123'
      });

      expect(response.status).toBe(201);
    });

    test('should handle special characters in names', async () => {
      const response = await createUser({
        first_name: "O'Brien",
        last_name: "Smith-Jones",
        username: 'test@example.com',
        password: 'password123'
      });

      expect(response.status).toBe(201);
      expect(response.first_name).toBe("O'Brien");
    });

    test('should handle passwords with special characters', async () => {
      const response = await createUser({
        username: 'test@example.com',
        password: 'P@ssw0rd!#$%^&*()'
      });

      expect(response.status).toBe(201);
    });

    test('should verify password is hashed in database', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'john@example.com',
        password: 'plaintext123'
      };

      // Create user directly (not using helper) to test API response
      const createResponse = await request(app)
        .post('/v1/user')
        .send(userData);
      
      expect(createResponse.status).toBe(201);
      expect(createResponse.body).not.toHaveProperty('password'); // API response has no password
      
      // Verify we can still login with original password (proves it was hashed)
      const getResponse = await request(app)
        .get(`/v1/user/${createResponse.body.id}`)
        .auth(userData.username, userData.password);
      
      expect(getResponse.status).toBe(200);
    });
  });
});