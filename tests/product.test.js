const request = require('supertest');
const app = require('../src/app');
const { faker } = require('@faker-js/faker');

describe('Product API Tests', () => {
  
  // Helper function to create a user
  const createUser = async (userData = {}) => {
    const defaultUser = {
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      username: faker.internet.email(),
      password: faker.internet.password({ length: 12 })
    };
    
    const response = await request(app)
      .post('/v1/user')
      .send({ ...defaultUser, ...userData });
    
    return {
      ...response.body,
      password: userData.password || defaultUser.password,
      username: userData.username || defaultUser.username
    };
  };

  // Helper function to create a product
  const createProduct = async (user, productData = {}) => {
    const defaultProduct = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      sku: faker.string.alphanumeric(10).toUpperCase(),
      manufacturer: faker.company.name(),
      quantity: faker.number.int({ min: 1, max: 100 })
    };
    
    return request(app)
      .post('/v1/product')
      .auth(user.username, user.password)
      .send({ ...defaultProduct, ...productData });
  };

  // ============================================
  // POSITIVE TEST CASES - Product Creation
  // ============================================
  
  describe('POST /v1/product - Create Product (Positive Tests)', () => {
    
    test('should create product with valid data and return 201', async () => {
      const user = await createUser();
      
      const productData = {
        name: 'Laptop',
        description: 'High-performance laptop',
        sku: 'LAP-12345',
        manufacturer: 'TechCorp',
        quantity: 10
      };

      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(productData.name);
      expect(response.body.description).toBe(productData.description);
      expect(response.body.sku).toBe(productData.sku);
      expect(response.body.manufacturer).toBe(productData.manufacturer);
      expect(response.body.quantity).toBe(productData.quantity);
      expect(response.body.owner_user_id).toBe(user.id);
      expect(response.body).toHaveProperty('date_added');
      expect(response.body).toHaveProperty('date_last_updated');
    });

    test('should create product with quantity 0', async () => {
      const user = await createUser();
      
      const response = await createProduct(user, { quantity: 0 });

      expect(response.status).toBe(201);
      expect(response.body.quantity).toBe(0);
    });

    test('should create multiple products for same user', async () => {
      const user = await createUser();
      
      const product1 = await createProduct(user, { name: 'Product 1' });
      const product2 = await createProduct(user, { name: 'Product 2' });

      expect(product1.status).toBe(201);
      expect(product2.status).toBe(201);
      expect(product1.body.id).not.toBe(product2.body.id);
      expect(product1.body.owner_user_id).toBe(user.id);
      expect(product2.body.owner_user_id).toBe(user.id);
    });
  });

  // ============================================
  // NEGATIVE TEST CASES - Product Creation
  // ============================================
  
  describe('POST /v1/product - Create Product (Negative Tests)', () => {
    
    test('should return 401 when no authentication provided', async () => {
      const response = await request(app)
        .post('/v1/product')
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10
        });

      expect(response.status).toBe(401);
    });

    test('should return 401 with invalid credentials', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, 'wrongpassword')
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10
        });

      expect(response.status).toBe(401);
    });

    test('should return 400 when name is missing', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when description is missing', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when sku is missing', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          manufacturer: 'Manufacturer',
          quantity: 10
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when manufacturer is missing', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          quantity: 10
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when quantity is missing', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when quantity is negative', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: -5
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when quantity is not an integer', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 'not-a-number'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when extra fields are provided', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10,
          extra_field: 'not allowed'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when trying to set date_added', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10,
          date_added: new Date().toISOString()
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when trying to set owner_user_id', async () => {
      const user = await createUser();
      
      const response = await request(app)
        .post('/v1/product')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10,
          owner_user_id: '123e4567-e89b-12d3-a456-426614174000'
        });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // POSITIVE TEST CASES - Get Product
  // ============================================
  
  describe('GET /v1/product/:productId - Get Product (Positive Tests)', () => {
    
    test('should get product with valid credentials (owner)', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(productId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('sku');
      expect(response.body).toHaveProperty('manufacturer');
      expect(response.body).toHaveProperty('quantity');
      expect(response.body.owner_user_id).toBe(user.id);
    });
  });

  // ============================================
  // NEGATIVE TEST CASES - Get Product
  // ============================================
  
  describe('GET /v1/product/:productId - Get Product (Negative Tests)', () => {
    
    test('should return 401 when no authentication provided', async () => {
      const response = await request(app)
        .get('/v1/product/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(401);
    });

    test('should return 401 with invalid credentials', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user.username, 'wrongpassword');

      expect(response.status).toBe(401);
    });

    test('should return 403 when trying to access another user product', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      
      const product = await createProduct(user1);
      const productId = product.body.id;

      const response = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user2.username, user2.password);

      expect(response.status).toBe(403);
    });

    test('should return 404 when product does not exist', async () => {
      const user = await createUser();

      const response = await request(app)
        .get('/v1/product/00000000-0000-0000-0000-000000000000')
        .auth(user.username, user.password);

      expect(response.status).toBe(404);
    });

    test('should return 400 for invalid UUID format', async () => {
      const user = await createUser();

      const response = await request(app)
        .get('/v1/product/invalid-uuid')
        .auth(user.username, user.password);

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // POSITIVE TEST CASES - Full Update (PUT)
  // ============================================
  
  describe('PUT /v1/product/:productId - Full Update (Positive Tests)', () => {
    
    test('should update product with valid data', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const updateData = {
        name: 'Updated Product',
        description: 'Updated description',
        sku: 'UPD-12345',
        manufacturer: 'Updated Manufacturer',
        quantity: 50
      };

      const response = await request(app)
        .put(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send(updateData);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    test('should verify updated product data persists', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const updateData = {
        name: 'Updated Product',
        description: 'Updated description',
        sku: 'UPD-12345',
        manufacturer: 'Updated Manufacturer',
        quantity: 50
      };

      await request(app)
        .put(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send(updateData);

      const response = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.sku).toBe(updateData.sku);
      expect(response.body.manufacturer).toBe(updateData.manufacturer);
      expect(response.body.quantity).toBe(updateData.quantity);
    });
  });

  // ============================================
  // NEGATIVE TEST CASES - Full Update (PUT)
  // ============================================
  
  describe('PUT /v1/product/:productId - Full Update (Negative Tests)', () => {
    
    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/v1/product/123e4567-e89b-12d3-a456-426614174000')
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10
        });

      expect(response.status).toBe(401);
    });

    test('should return 403 when trying to update another user product', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      
      const product = await createProduct(user1);
      const productId = product.body.id;

      const response = await request(app)
        .put(`/v1/product/${productId}`)
        .auth(user2.username, user2.password)
        .send({
          name: 'Hacked Product',
          description: 'Hacked',
          sku: 'HACK-123',
          manufacturer: 'Hacker',
          quantity: 999
        });

      expect(response.status).toBe(403);
    });

    test('should return 404 when product does not exist', async () => {
      const user = await createUser();

      const response = await request(app)
        .put('/v1/product/00000000-0000-0000-0000-000000000000')
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10
        });

      expect(response.status).toBe(404);
    });

    test('should return 400 when required fields are missing', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .put(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({
          name: 'Product'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 when trying to update owner_user_id', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .put(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({
          name: 'Product',
          description: 'Description',
          sku: 'SKU-123',
          manufacturer: 'Manufacturer',
          quantity: 10,
          owner_user_id: '00000000-0000-0000-0000-000000000000'
        });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // POSITIVE TEST CASES - Partial Update (PATCH)
  // ============================================
  
  describe('PATCH /v1/product/:productId - Partial Update (Positive Tests)', () => {
    
    test('should update only name', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;
      const originalProduct = createResponse.body;

      const response = await request(app)
        .patch(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({ name: 'New Name Only' });

      expect(response.status).toBe(204);

      // Verify only name changed
      const getResponse = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      expect(getResponse.body.name).toBe('New Name Only');
      expect(getResponse.body.description).toBe(originalProduct.description);
      expect(getResponse.body.sku).toBe(originalProduct.sku);
    });

    test('should update only quantity', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .patch(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({ quantity: 999 });

      expect(response.status).toBe(204);

      const getResponse = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      expect(getResponse.body.quantity).toBe(999);
    });

    test('should update multiple fields', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .patch(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({
          name: 'Partially Updated',
          quantity: 777
        });

      expect(response.status).toBe(204);

      const getResponse = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      expect(getResponse.body.name).toBe('Partially Updated');
      expect(getResponse.body.quantity).toBe(777);
    });
  });

  // ============================================
  // NEGATIVE TEST CASES - Partial Update (PATCH)
  // ============================================
  
  describe('PATCH /v1/product/:productId - Partial Update (Negative Tests)', () => {
    
    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch('/v1/product/123e4567-e89b-12d3-a456-426614174000')
        .send({ name: 'New Name' });

      expect(response.status).toBe(401);
    });

    test('should return 403 when trying to update another user product', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      
      const product = await createProduct(user1);
      const productId = product.body.id;

      const response = await request(app)
        .patch(`/v1/product/${productId}`)
        .auth(user2.username, user2.password)
        .send({ name: 'Hacked' });

      expect(response.status).toBe(403);
    });

    test('should return 404 when product does not exist', async () => {
      const user = await createUser();

      const response = await request(app)
        .patch('/v1/product/00000000-0000-0000-0000-000000000000')
        .auth(user.username, user.password)
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });

    test('should return 400 when trying to update owner_user_id', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .patch(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({ owner_user_id: '00000000-0000-0000-0000-000000000000' });

      expect(response.status).toBe(400);
    });

    test('should return 400 when no fields provided', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .patch(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({});

      expect(response.status).toBe(400);
    });

    test('should return 400 for invalid quantity in patch', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .patch(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({ quantity: -10 });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // POSITIVE TEST CASES - Delete Product
  // ============================================
  
  describe('DELETE /v1/product/:productId - Delete Product (Positive Tests)', () => {
    
    test('should delete product successfully', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      const response = await request(app)
        .delete(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    test('should verify deleted product no longer exists', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;

      // Delete product
      await request(app)
        .delete(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      // Try to get deleted product
      const response = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // NEGATIVE TEST CASES - Delete Product
  // ============================================
  
  describe('DELETE /v1/product/:productId - Delete Product (Negative Tests)', () => {
    
    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/v1/product/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(401);
    });

    test('should return 403 when trying to delete another user product', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      
      const product = await createProduct(user1);
      const productId = product.body.id;

      const response = await request(app)
        .delete(`/v1/product/${productId}`)
        .auth(user2.username, user2.password);

      expect(response.status).toBe(403);
    });

    test('should return 404 when product does not exist', async () => {
      const user = await createUser();

      const response = await request(app)
        .delete('/v1/product/00000000-0000-0000-0000-000000000000')
        .auth(user.username, user.password);

      expect(response.status).toBe(404);
    });

    test('should return 400 for invalid UUID format', async () => {
      const user = await createUser();

      const response = await request(app)
        .delete('/v1/product/invalid-uuid')
        .auth(user.username, user.password);

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // EDGE CASE TESTS
  // ============================================
  
  describe('Product API - Edge Cases', () => {
    
    test('should reject very long product name (boundary test)', async () => {
      const user = await createUser();
      
      const response = await createProduct(user, {
        name: 'A'.repeat(500) // Exceeds VARCHAR(255) limit
      });

      // Database correctly rejects values exceeding VARCHAR(255)
      expect(response.status).toBe(400);
    });

    test('should reject very long description (boundary test)', async () => {
      const user = await createUser();
      
      const response = await createProduct(user, {
        description: 'B'.repeat(1000) // Exceeds VARCHAR limit
      });

      // Database correctly rejects values exceeding limit
      expect(response.status).toBe(400);
    });

    test('should accept product name at boundary (255 chars)', async () => {
      const user = await createUser();
      
      const response = await createProduct(user, {
        name: 'A'.repeat(255) // Exactly at limit
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toHaveLength(255);
    });

    test('should handle special characters in product fields', async () => {
      const user = await createUser();
      
      const response = await createProduct(user, {
        name: "Product's \"Special\" Name & More",
        sku: 'SKU-#@$%',
        manufacturer: "Manufacturer's <Name>"
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Product's \"Special\" Name & More");
    });

    test('should handle maximum quantity value', async () => {
      const user = await createUser();
      
      const response = await createProduct(user, {
        quantity: 999999999
      });

      expect(response.status).toBe(201);
      expect(response.body.quantity).toBe(999999999);
    });

    test('should handle concurrent product creation', async () => {
      const user = await createUser();
      
      const promises = Array(5).fill(null).map((_, i) => 
        createProduct(user, { name: `Product ${i}` })
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.status).toBe(201);
      });

      // Verify all have unique IDs
      const ids = results.map(r => r.body.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    test('should verify date_last_updated changes on update', async () => {
      const user = await createUser();
      const createResponse = await createProduct(user);
      const productId = createResponse.body.id;
      const originalDate = createResponse.body.date_last_updated;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app)
        .patch(`/v1/product/${productId}`)
        .auth(user.username, user.password)
        .send({ quantity: 999 });

      const getResponse = await request(app)
        .get(`/v1/product/${productId}`)
        .auth(user.username, user.password);

      expect(getResponse.body.date_last_updated).not.toBe(originalDate);
    });

    test('should not modify unrelated products when updating one', async () => {
      const user = await createUser();
      const product1 = await createProduct(user, { name: 'Product 1', quantity: 10 });
      const product2 = await createProduct(user, { name: 'Product 2', quantity: 20 });

      // Update product1
      await request(app)
        .patch(`/v1/product/${product1.body.id}`)
        .auth(user.username, user.password)
        .send({ quantity: 999 });

      // Verify product2 unchanged
      const getProduct2 = await request(app)
        .get(`/v1/product/${product2.body.id}`)
        .auth(user.username, user.password);

      expect(getProduct2.body.name).toBe('Product 2');
      expect(getProduct2.body.quantity).toBe(20);
    });

    test('should handle deleting product and creating new one with same user', async () => {
      const user = await createUser();
      const product1 = await createProduct(user, { name: 'Product 1' });

      // Delete product
      await request(app)
        .delete(`/v1/product/${product1.body.id}`)
        .auth(user.username, user.password);

      // Create new product
      const product2 = await createProduct(user, { name: 'Product 2' });

      expect(product2.status).toBe(201);
      expect(product2.body.id).not.toBe(product1.body.id);
    });
  });
});