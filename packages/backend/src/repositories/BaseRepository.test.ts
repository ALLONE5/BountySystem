import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseRepository } from './BaseRepository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { PoolClient } from 'pg';

/**
 * Test Model Interface
 */
interface TestModel {
  id?: number;
  name: string;
  email: string;
  age?: number;
  created_at?: Date;
}

/**
 * Concrete Test Repository Implementation
 * Used for testing BaseRepository functionality
 */
class TestRepository extends BaseRepository<TestModel> {
  constructor() {
    super('test_table');
  }

  protected getColumns(): string[] {
    return ['id', 'name', 'email', 'age', 'created_at'];
  }

  protected mapRowToModel(row: any): TestModel {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      age: row.age,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
    };
  }

  protected validateData(data: Partial<TestModel>, isUpdate: boolean = false): void {
    if (!isUpdate) {
      // For create, name and email are required
      if (!data.name) {
        throw new ValidationError('name is required');
      }
      if (!data.email) {
        throw new ValidationError('email is required');
      }
    }

    // Validate email format if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new ValidationError('Invalid email format');
      }
    }

    // Validate age if provided
    if (data.age !== undefined && data.age < 0) {
      throw new ValidationError('age must be non-negative');
    }
  }
}

/**
 * Helper to create a mock PoolClient
 */
function createMockClient(queryResults: any[] = []): PoolClient {
  let queryIndex = 0;
  
  const mockClient = {
    query: vi.fn(async (sql: string, params?: any[]) => {
      const result = queryResults[queryIndex] || { rows: [], rowCount: 0 };
      queryIndex++;
      return result;
    }),
    release: vi.fn(),
  } as unknown as PoolClient;

  return mockClient;
}

describe('BaseRepository', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should find entity by id', async () => {
      const mockRow = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        created_at: new Date('2024-01-01'),
      };

      // Mock the pool.connect to return a client with our mock data
      const mockClient = createMockClient([{ rows: [mockRow], rowCount: 1 }]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      const result = await repository.findById(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.name).toBe('John Doe');
      expect(result?.email).toBe('john@example.com');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null when entity not found', async () => {
      const mockClient = createMockClient([{ rows: [], rowCount: 0 }]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      const result = await repository.findById(999);

      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid id', async () => {
      await expect(repository.findById(-1)).rejects.toThrow(ValidationError);
      await expect(repository.findById(0)).rejects.toThrow(ValidationError);
    });

    it('should release connection on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn().mockRejectedValue(new Error('Database error'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.findById(1)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should find all entities without filters', async () => {
      const mockRows = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
      ];

      const mockClient = createMockClient([{ rows: mockRows, rowCount: 2 }]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
      expect(result[1].name).toBe('Jane');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should find entities with filters', async () => {
      const mockRows = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
      ];

      const mockClient = createMockClient([{ rows: mockRows, rowCount: 1 }]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      const result = await repository.findAll({ age: 30 });

      expect(result).toHaveLength(1);
      expect(result[0].age).toBe(30);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return empty array when no entities found', async () => {
      const mockClient = createMockClient([{ rows: [], rowCount: 0 }]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release connection on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn().mockRejectedValue(new Error('Database error'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.findAll()).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new entity', async () => {
      const newData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const mockRow = {
        id: 1,
        ...newData,
        created_at: new Date(),
      };

      const mockClient = createMockClient([{ rows: [mockRow], rowCount: 1 }]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      const result = await repository.create(newData);

      expect(result.id).toBe(1);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw ValidationError for missing required fields', async () => {
      const invalidData = {
        name: 'John Doe',
        // email is missing
      };

      await expect(repository.create(invalidData as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
      };

      await expect(repository.create(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative age', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -5,
      };

      await expect(repository.create(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should work with provided client (transaction support)', async () => {
      const newData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockRow = { id: 1, ...newData };
      const mockClient = createMockClient([{ rows: [mockRow], rowCount: 1 }]);

      const result = await repository.create(newData, mockClient);

      expect(result.id).toBe(1);
      expect(mockClient.release).not.toHaveBeenCalled(); // Should not release provided client
    });

    it('should release connection on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn().mockRejectedValue(new Error('Database error'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      const newData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      await expect(repository.create(newData)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing entity', async () => {
      const updateData = {
        name: 'Jane Doe',
        age: 35,
      };

      const mockRow = {
        id: 1,
        name: 'Jane Doe',
        email: 'john@example.com',
        age: 35,
      };

      const mockClient = createMockClient([
        { rows: [{ id: 1 }], rowCount: 1 }, // exists check
        { rows: [mockRow], rowCount: 1 },   // update result
      ]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      const result = await repository.update(1, updateData);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Jane Doe');
      expect(result.age).toBe(35);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw NotFoundError when entity does not exist', async () => {
      const mockClient = createMockClient([
        { rows: [], rowCount: 0 }, // exists check fails
      ]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(NotFoundError);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid id', async () => {
      await expect(repository.update(-1, { name: 'New Name' })).rejects.toThrow(ValidationError);
      await expect(repository.update(0, { name: 'New Name' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when no fields to update', async () => {
      const mockClient = createMockClient([
        { rows: [{ id: 1 }], rowCount: 1 }, // exists check
      ]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.update(1, {})).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email in update', async () => {
      const mockClient = createMockClient([
        { rows: [{ id: 1 }], rowCount: 1 }, // exists check
      ]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.update(1, { email: 'invalid-email' })).rejects.toThrow(ValidationError);
    });

    it('should work with provided client (transaction support)', async () => {
      const updateData = { name: 'Jane Doe' };
      const mockRow = { id: 1, name: 'Jane Doe', email: 'john@example.com' };
      
      const mockClient = createMockClient([
        { rows: [{ id: 1 }], rowCount: 1 },
        { rows: [mockRow], rowCount: 1 },
      ]);

      const result = await repository.update(1, updateData, mockClient);

      expect(result.id).toBe(1);
      expect(mockClient.release).not.toHaveBeenCalled();
    });

    it('should release connection on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })
        .mockRejectedValueOnce(new Error('Database error'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.update(1, { name: 'New Name' })).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an existing entity', async () => {
      const mockClient = createMockClient([
        { rows: [{ id: 1 }], rowCount: 1 }, // exists check
        { rows: [], rowCount: 1 },          // delete result
      ]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.delete(1)).resolves.not.toThrow();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw NotFoundError when entity does not exist', async () => {
      const mockClient = createMockClient([
        { rows: [], rowCount: 0 }, // exists check fails
      ]);
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid id', async () => {
      await expect(repository.delete(-1)).rejects.toThrow(ValidationError);
      await expect(repository.delete(0)).rejects.toThrow(ValidationError);
    });

    it('should work with provided client (transaction support)', async () => {
      const mockClient = createMockClient([
        { rows: [{ id: 1 }], rowCount: 1 },
        { rows: [], rowCount: 1 },
      ]);

      await expect(repository.delete(1, mockClient)).resolves.not.toThrow();
      expect(mockClient.release).not.toHaveBeenCalled();
    });

    it('should release connection on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })
        .mockRejectedValueOnce(new Error('Database error'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.delete(1)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('should always release connection in findById even on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn().mockRejectedValue(new Error('Query failed'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.findById(1)).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should always release connection in findAll even on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn().mockRejectedValue(new Error('Query failed'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.findAll()).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should always release connection in create even on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn().mockRejectedValue(new Error('Query failed'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.create({ name: 'Test', email: 'test@example.com' })).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should always release connection in update even on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn().mockRejectedValue(new Error('Query failed'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.update(1, { name: 'Test' })).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should always release connection in delete even on error', async () => {
      const mockClient = createMockClient();
      mockClient.query = vi.fn().mockRejectedValue(new Error('Query failed'));
      vi.spyOn(repository['pool'], 'connect').mockResolvedValue(mockClient);

      await expect(repository.delete(1)).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should not release provided client in create', async () => {
      const mockClient = createMockClient([{ rows: [{ id: 1, name: 'Test', email: 'test@example.com' }], rowCount: 1 }]);

      await repository.create({ name: 'Test', email: 'test@example.com' }, mockClient);
      expect(mockClient.release).not.toHaveBeenCalled();
    });

    it('should not release provided client in update', async () => {
      const mockClient = createMockClient([
        { rows: [{ id: 1 }], rowCount: 1 },
        { rows: [{ id: 1, name: 'Test', email: 'test@example.com' }], rowCount: 1 },
      ]);

      await repository.update(1, { name: 'Test' }, mockClient);
      expect(mockClient.release).not.toHaveBeenCalled();
    });

    it('should not release provided client in delete', async () => {
      const mockClient = createMockClient([
        { rows: [{ id: 1 }], rowCount: 1 },
        { rows: [], rowCount: 1 },
      ]);

      await repository.delete(1, mockClient);
      expect(mockClient.release).not.toHaveBeenCalled();
    });
  });
});
