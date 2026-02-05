import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { DIContainer } from './DIContainer';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('Property 2: DI Container Singleton Behavior', () => {
    // Feature: backend-refactoring, Property 2: DI Container Singleton Behavior
    it('should return the same instance when resolving a service multiple times', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.integer({ min: 1, max: 100 }),
          (serviceName, resolveCount) => {
            // Create a fresh container for each test run
            const testContainer = new DIContainer();
            
            // Register a service that creates a new object each time
            let creationCount = 0;
            testContainer.register(serviceName, () => {
              creationCount++;
              return { id: creationCount, timestamp: Date.now() };
            });

            // Resolve the service multiple times
            const instances = [];
            for (let i = 0; i < resolveCount; i++) {
              instances.push(testContainer.resolve(serviceName));
            }

            // All instances should be the exact same reference
            const firstInstance = instances[0];
            for (const instance of instances) {
              expect(instance).toBe(firstInstance);
            }

            // Factory should only be called once
            expect(creationCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain singleton behavior across different service types', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
          (serviceNames) => {
            // Create a fresh container for each test run
            const testContainer = new DIContainer();
            
            // Use unique service names
            const uniqueNames = Array.from(new Set(serviceNames));

            // Register multiple services
            const creationCounts = new Map<string, number>();
            uniqueNames.forEach(name => {
              creationCounts.set(name, 0);
              testContainer.register(name, () => {
                creationCounts.set(name, creationCounts.get(name)! + 1);
                return { name, value: Math.random() };
              });
            });

            // Resolve each service twice
            uniqueNames.forEach(name => {
              const first = testContainer.resolve(name);
              const second = testContainer.resolve(name);
              
              // Should be same instance
              expect(first).toBe(second);
              
              // Factory should only be called once
              expect(creationCounts.get(name)).toBe(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: DI Container Dependency Resolution', () => {
    // Feature: backend-refactoring, Property 3: DI Container Dependency Resolution
    it('should automatically resolve service dependencies', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (serviceAName, serviceBName, serviceCName) => {
            // Ensure unique names
            if (serviceAName === serviceBName || serviceAName === serviceCName || serviceBName === serviceCName) {
              return;
            }

            const testContainer = new DIContainer();

            // Register service A (no dependencies)
            testContainer.register(serviceAName, () => ({
              name: serviceAName,
              value: 'A'
            }));

            // Register service B (depends on A)
            testContainer.register(serviceBName, (c) => ({
              name: serviceBName,
              value: 'B',
              dependency: c.resolve(serviceAName)
            }));

            // Register service C (depends on B, which depends on A)
            testContainer.register(serviceCName, (c) => ({
              name: serviceCName,
              value: 'C',
              dependency: c.resolve(serviceBName)
            }));

            // Resolve service C
            const serviceC = testContainer.resolve(serviceCName);

            // Verify the entire dependency chain is resolved
            expect(serviceC.name).toBe(serviceCName);
            expect(serviceC.value).toBe('C');
            expect(serviceC.dependency).toBeDefined();
            expect(serviceC.dependency.name).toBe(serviceBName);
            expect(serviceC.dependency.value).toBe('B');
            expect(serviceC.dependency.dependency).toBeDefined();
            expect(serviceC.dependency.dependency.name).toBe(serviceAName);
            expect(serviceC.dependency.dependency.value).toBe('A');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should resolve multiple dependencies correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 5 }),
          (serviceNames) => {
            // Ensure unique names
            const uniqueNames = Array.from(new Set(serviceNames));
            if (uniqueNames.length < 2) {
              return;
            }

            const testContainer = new DIContainer();

            // Register all services except the last one (no dependencies)
            for (let i = 0; i < uniqueNames.length - 1; i++) {
              const name = uniqueNames[i];
              testContainer.register(name, () => ({
                name,
                id: i
              }));
            }

            // Register the last service with dependencies on all others
            const lastServiceName = uniqueNames[uniqueNames.length - 1];
            testContainer.register(lastServiceName, (c) => {
              const dependencies: any[] = [];
              for (let i = 0; i < uniqueNames.length - 1; i++) {
                dependencies.push(c.resolve(uniqueNames[i]));
              }
              return {
                name: lastServiceName,
                dependencies
              };
            });

            // Resolve the last service
            const lastService = testContainer.resolve(lastServiceName);

            // Verify all dependencies are resolved
            expect(lastService.name).toBe(lastServiceName);
            expect(lastService.dependencies).toHaveLength(uniqueNames.length - 1);
            
            for (let i = 0; i < uniqueNames.length - 1; i++) {
              expect(lastService.dependencies[i].name).toBe(uniqueNames[i]);
              expect(lastService.dependencies[i].id).toBe(i);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect direct circular dependencies', () => {
      // Service A depends on Service B
      container.register('serviceA', (c) => ({
        name: 'A',
        dependency: c.resolve('serviceB')
      }));

      // Service B depends on Service A (circular)
      container.register('serviceB', (c) => ({
        name: 'B',
        dependency: c.resolve('serviceA')
      }));

      // Should throw error with circular dependency message
      expect(() => container.resolve('serviceA')).toThrow(/Circular dependency detected/);
      expect(() => container.resolve('serviceA')).toThrow(/serviceA.*serviceB/);
    });

    it('should detect indirect circular dependencies', () => {
      // Service A depends on Service B
      container.register('serviceA', (c) => ({
        name: 'A',
        dependency: c.resolve('serviceB')
      }));

      // Service B depends on Service C
      container.register('serviceB', (c) => ({
        name: 'B',
        dependency: c.resolve('serviceC')
      }));

      // Service C depends on Service A (circular through chain)
      container.register('serviceC', (c) => ({
        name: 'C',
        dependency: c.resolve('serviceA')
      }));

      // Should throw error with circular dependency message
      expect(() => container.resolve('serviceA')).toThrow(/Circular dependency detected/);
    });

    it('should provide descriptive error message for circular dependencies', () => {
      container.register('serviceA', (c) => ({
        dependency: c.resolve('serviceB')
      }));

      container.register('serviceB', (c) => ({
        dependency: c.resolve('serviceA')
      }));

      try {
        container.resolve('serviceA');
        expect.fail('Should have thrown circular dependency error');
      } catch (error: any) {
        expect(error.message).toContain('Circular dependency detected');
        expect(error.message).toContain('serviceA');
        expect(error.message).toContain('serviceB');
      }
    });
  });

  describe('Missing Dependency Detection', () => {
    it('should throw error when resolving unregistered service', () => {
      expect(() => container.resolve('nonExistentService')).toThrow(/not registered/);
      expect(() => container.resolve('nonExistentService')).toThrow(/nonExistentService/);
    });

    it('should throw error when dependency is not registered', () => {
      container.register('serviceA', (c) => ({
        name: 'A',
        dependency: c.resolve('nonExistentDependency')
      }));

      expect(() => container.resolve('serviceA')).toThrow(/not registered/);
      expect(() => container.resolve('serviceA')).toThrow(/nonExistentDependency/);
    });

    it('should provide descriptive error message for missing dependencies', () => {
      container.register('serviceA', (c) => ({
        dependency: c.resolve('missingService')
      }));

      try {
        container.resolve('serviceA');
        expect.fail('Should have thrown missing dependency error');
      } catch (error: any) {
        expect(error.message).toContain('not registered');
        expect(error.message).toContain('missingService');
      }
    });
  });

  describe('Container Management', () => {
    it('should check if service is registered', () => {
      container.register('testService', () => ({ value: 'test' }));

      expect(container.has('testService')).toBe(true);
      expect(container.has('nonExistentService')).toBe(false);
    });

    it('should list all registered services', () => {
      container.register('serviceA', () => ({ name: 'A' }));
      container.register('serviceB', () => ({ name: 'B' }));
      container.register('serviceC', () => ({ name: 'C' }));

      const services = container.getRegisteredServices();
      expect(services).toContain('serviceA');
      expect(services).toContain('serviceB');
      expect(services).toContain('serviceC');
      expect(services).toHaveLength(3);
    });

    it('should clear all services and factories', () => {
      container.register('serviceA', () => ({ name: 'A' }));
      container.register('serviceB', () => ({ name: 'B' }));
      
      const serviceA = container.resolve('serviceA');
      expect(serviceA).toBeDefined();

      container.clear();

      expect(container.has('serviceA')).toBe(false);
      expect(container.has('serviceB')).toBe(false);
      expect(container.getRegisteredServices()).toHaveLength(0);
    });

    it('should throw error when registering duplicate service', () => {
      container.register('duplicateService', () => ({ value: 1 }));

      expect(() => {
        container.register('duplicateService', () => ({ value: 2 }));
      }).toThrow(/already registered/);
      expect(() => {
        container.register('duplicateService', () => ({ value: 2 }));
      }).toThrow(/duplicateService/);
    });
  });
});
