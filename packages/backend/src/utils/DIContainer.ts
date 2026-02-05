/**
 * Dependency Injection Container
 * 
 * Manages service dependencies and lifecycle with singleton pattern.
 * Provides automatic dependency resolution and circular dependency detection.
 */

type ServiceFactory<T> = (container: DIContainer) => T;

export class DIContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, ServiceFactory<any>> = new Map();
  private resolving: Set<string> = new Set();

  /**
   * Register a service with its factory function
   * @param name - Unique service identifier
   * @param factory - Factory function that creates the service instance
   * @throws Error if service is already registered
   */
  register<T>(name: string, factory: ServiceFactory<T>): void {
    if (this.factories.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }
    this.factories.set(name, factory);
  }

  /**
   * Resolve a service by name
   * Returns cached instance if already resolved (singleton pattern)
   * @param name - Service identifier
   * @returns Service instance
   * @throws Error if service is not registered or circular dependency detected
   */
  resolve<T>(name: string): T {
    // Check if already instantiated (singleton)
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Check for circular dependencies
    if (this.resolving.has(name)) {
      const resolvingChain = Array.from(this.resolving).join(' -> ');
      throw new Error(`Circular dependency detected: ${resolvingChain} -> ${name}`);
    }

    // Get factory
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service ${name} is not registered`);
    }

    // Resolve dependencies
    this.resolving.add(name);
    try {
      const instance = factory(this);
      this.services.set(name, instance);
      return instance;
    } finally {
      this.resolving.delete(name);
    }
  }

  /**
   * Check if a service is registered
   * @param name - Service identifier
   * @returns true if service is registered
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Clear all services and factories
   * Useful for testing
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.resolving.clear();
  }

  /**
   * Get all registered service names
   * @returns Array of service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.factories.keys());
  }
}
