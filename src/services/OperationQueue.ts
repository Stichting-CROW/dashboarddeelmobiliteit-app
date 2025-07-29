import { LayerOperation, LayerOperationResult, QueuedOperation, OperationQueueConfig } from '../types/LayerTypes';

/**
 * Robust operation queuing system for layer operations
 */
export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;
  private mapReady = false;
  private config: OperationQueueConfig;
  private currentOperationId: string | null = null;

  constructor(config: OperationQueueConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 100,
      maxQueueSize: 100,
      timeout: 10000,
      ...config
    };
  }

  /**
   * Enqueue an operation for processing
   */
  async enqueue(operation: LayerOperation): Promise<LayerOperationResult> {
    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize!) {
      return {
        success: false,
        layerId: operation.layerId,
        error: 'Operation queue is full',
        canRetry: false
      };
    }

    const queuedOp: QueuedOperation = {
      id: this.generateId(),
      operation,
      timestamp: Date.now(),
      retryCount: 0,
      priority: this.getOperationPriority(operation)
    };

    this.queue.push(queuedOp);
    
    // Sort queue by priority (higher priority first)
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    console.log(`Operation queued: ${operation.type} for ${operation.layerId} (queue size: ${this.queue.length})`);

    // Process immediately if map is ready and not currently processing
    if (this.mapReady && !this.processing) {
      return this.processQueue();
    }

    // Wait for map to be ready and processing to complete
    return this.waitForMapAndProcess();
  }

  /**
   * Set map ready state
   */
  setMapReady(ready: boolean): void {
    this.mapReady = ready;
    if (ready && this.queue.length > 0 && !this.processing) {
      // Process queued operations when map becomes ready
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * Process all queued operations
   */
  private async processQueue(): Promise<LayerOperationResult> {
    if (this.processing) {
      return this.waitForCurrentOperation();
    }

    if (this.queue.length === 0) {
      return {
        success: true,
        layerId: 'none',
        warnings: ['No operations to process']
      };
    }

    this.processing = true;
    console.log(`Processing ${this.queue.length} queued operations`);

    try {
      const results: LayerOperationResult[] = [];
      const processedOperations: QueuedOperation[] = [];

      for (const queuedOp of this.queue) {
        try {
          // Check if operation is too old
          const age = Date.now() - queuedOp.timestamp;
          if (age > this.config.timeout!) {
            console.warn(`Skipping old operation: ${queuedOp.operation.type} for ${queuedOp.operation.layerId} (age: ${age}ms)`);
            processedOperations.push(queuedOp);
            continue;
          }

          // Execute the operation
          this.currentOperationId = queuedOp.id;
          const result = await this.executeOperation(queuedOp);
          results.push(result);
          processedOperations.push(queuedOp);

          // Stop processing on critical errors
          if (!result.success && result.critical) {
            console.error(`Critical error in operation ${queuedOp.operation.type} for ${queuedOp.operation.layerId}, stopping queue processing`);
            break;
          }

        } catch (error) {
          console.error(`Error processing operation ${queuedOp.operation.type} for ${queuedOp.operation.layerId}:`, error);
          
          // Retry if under max retries
          if (queuedOp.retryCount < this.config.maxRetries!) {
            queuedOp.retryCount++;
            queuedOp.timestamp = Date.now();
            console.log(`Re-queued operation ${queuedOp.operation.type} for ${queuedOp.operation.layerId} (retry ${queuedOp.retryCount}/${this.config.maxRetries})`);
          } else {
            console.error(`Max retries exceeded for operation ${queuedOp.operation.type} for ${queuedOp.operation.layerId}`);
            processedOperations.push(queuedOp);
            results.push({
              success: false,
              layerId: queuedOp.operation.layerId,
              error: `Max retries exceeded: ${error instanceof Error ? error.message : 'Unknown error'}`,
              canRetry: false
            });
          }
        }
      }

      // Remove processed operations from queue
      for (const processedOp of processedOperations) {
        const index = this.queue.findIndex(op => op.id === processedOp.id);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
      }

      return this.aggregateResults(results);

    } finally {
      this.processing = false;
      this.currentOperationId = null;
      
      // If new operations were added during processing, process them
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), this.config.retryDelay);
      }
    }
  }

  /**
   * Wait for map to be ready and then process queue
   */
  private async waitForMapAndProcess(): Promise<LayerOperationResult> {
    const startTime = Date.now();
    const timeout = this.config.timeout!;

    while (!this.mapReady && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!this.mapReady) {
      return {
        success: false,
        layerId: 'unknown',
        error: 'Map not ready within timeout period',
        canRetry: true
      };
    }

    return this.processQueue();
  }

  /**
   * Wait for current operation to complete
   */
  private async waitForCurrentOperation(): Promise<LayerOperationResult> {
    const startTime = Date.now();
    const timeout = this.config.timeout!;

    while (this.processing && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (this.processing) {
      return {
        success: false,
        layerId: 'unknown',
        error: 'Operation queue processing timeout',
        canRetry: true
      };
    }

    return this.processQueue();
  }

  /**
   * Execute a single operation
   */
  private async executeOperation(queuedOp: QueuedOperation): Promise<LayerOperationResult> {
    const { operation } = queuedOp;
    
    console.log(`Executing operation: ${operation.type} for ${operation.layerId}`);

    // This is a placeholder - the actual execution will be handled by the LayerService
    // The LayerService will inject the execution logic
    return {
      success: true,
      layerId: operation.layerId,
      warnings: ['Operation executed successfully']
    };
  }

  /**
   * Aggregate multiple operation results
   */
  private aggregateResults(results: LayerOperationResult[]): LayerOperationResult {
    if (results.length === 0) {
      return {
        success: true,
        layerId: 'none',
        warnings: ['No operations to aggregate']
      };
    }

    if (results.length === 1) {
      return results[0];
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const warnings = results.flatMap(r => r.warnings || []);

    return {
      success: failed.length === 0,
      layerId: 'batch',
      error: failed.length > 0 ? `${failed.length} operations failed` : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      canRetry: failed.some(r => r.canRetry)
    };
  }

  /**
   * Get operation priority (higher number = higher priority)
   */
  private getOperationPriority(operation: LayerOperation): number {
    switch (operation.type) {
      case 'add':
        return 10; // Highest priority - adding layers/sources
      case 'show':
        return 8;  // High priority - showing layers
      case 'hide':
        return 6;  // Medium priority - hiding layers
      case 'update':
        return 4;  // Lower priority - updating layers
      case 'remove':
        return 2;  // Lowest priority - removing layers
      default:
        return 5;
    }
  }

  /**
   * Generate unique operation ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueSize: number;
    processing: boolean;
    mapReady: boolean;
    currentOperation: string | null;
  } {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      mapReady: this.mapReady,
      currentOperation: this.currentOperationId
    };
  }

  /**
   * Clear all queued operations
   */
  clear(): void {
    this.queue = [];
    console.log('Operation queue cleared');
  }

  /**
   * Get queued operations (for debugging)
   */
  getQueuedOperations(): QueuedOperation[] {
    return [...this.queue];
  }
} 