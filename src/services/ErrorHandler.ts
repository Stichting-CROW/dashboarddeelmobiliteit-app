import { LayerError, LayerOperation, LayerOperationResult, RecoveryStrategy } from '../types/LayerTypes';

/**
 * Centralized error handling for layer operations
 */
export class LayerErrorHandler {
  private errorTypes = {
    LAYER_NOT_FOUND: 'Layer does not exist',
    SOURCE_NOT_FOUND: 'Source does not exist',
    DEPENDENCY_MISSING: 'Required dependency not available',
    MAP_NOT_READY: 'Map is not ready for operations',
    OPERATION_TIMEOUT: 'Operation timed out',
    INVALID_STATE: 'Invalid layer state'
  };

  /**
   * Handle an error with context and determine recovery strategy
   */
  async handleError(error: LayerError, context: LayerOperation): Promise<LayerOperationResult> {
    // Log error with context
    this.logError(error, context);
    
    // Determine recovery strategy
    const recovery = this.determineRecoveryStrategy(error, context);
    
    // Execute recovery if possible
    if (recovery.canRecover) {
      return await this.executeRecovery(recovery, context);
    }
    
    // Return error result
    return {
      success: false,
      layerId: context.layerId,
      error: error.message,
      canRetry: recovery.canRetry
    };
  }

  /**
   * Determine the best recovery strategy for an error
   */
  private determineRecoveryStrategy(error: LayerError, context: LayerOperation): RecoveryStrategy {
    switch (error.type) {
      case 'LAYER_NOT_FOUND':
        return { 
          canRecover: true, 
          canRetry: false, 
          strategy: 'ADD_MISSING_LAYER' 
        };
      
      case 'SOURCE_NOT_FOUND':
        return { 
          canRecover: true, 
          canRetry: false, 
          strategy: 'ADD_MISSING_SOURCE' 
        };
      
      case 'DEPENDENCY_MISSING':
        return { 
          canRecover: true, 
          canRetry: false, 
          strategy: 'ADD_MISSING_SOURCE' 
        };
      
      case 'MAP_NOT_READY':
        return { 
          canRecover: false, 
          canRetry: true, 
          strategy: 'RETRY_AFTER_DELAY',
          delay: 100
        };
      
      case 'OPERATION_TIMEOUT':
        return { 
          canRecover: false, 
          canRetry: true, 
          strategy: 'RETRY_AFTER_DELAY',
          delay: 500
        };
      
      case 'INVALID_STATE':
        return { 
          canRecover: false, 
          canRetry: false, 
          strategy: 'FAIL' 
        };
      
      default:
        return { 
          canRecover: false, 
          canRetry: false, 
          strategy: 'FAIL' 
        };
    }
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecovery(recovery: RecoveryStrategy, context: LayerOperation): Promise<LayerOperationResult> {
    console.log(`Executing recovery strategy: ${recovery.strategy} for ${context.layerId}`);

    try {
      switch (recovery.strategy) {
        case 'ADD_MISSING_LAYER':
          return this.addMissingLayer(context);
        
        case 'ADD_MISSING_SOURCE':
          return this.addMissingSource(context);
        
        case 'RETRY_AFTER_DELAY':
          return await this.retryAfterDelay(context, recovery.delay || 100);
        
        case 'FAIL':
        default:
          return {
            success: false,
            layerId: context.layerId,
            error: 'Recovery strategy failed',
            canRetry: false
          };
      }
    } catch (recoveryError) {
      console.error(`Recovery strategy failed for ${context.layerId}:`, recoveryError);
      return {
        success: false,
        layerId: context.layerId,
        error: `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`,
        canRetry: false
      };
    }
  }

  /**
   * Add missing layer (placeholder - will be implemented by LayerService)
   */
  private addMissingLayer(context: LayerOperation): LayerOperationResult {
    // This will be implemented by the LayerService
    // For now, return a placeholder result
    return {
      success: false,
      layerId: context.layerId,
      error: 'Add missing layer recovery not implemented',
      canRetry: false
    };
  }

  /**
   * Add missing source (placeholder - will be implemented by LayerService)
   */
  private addMissingSource(context: LayerOperation): LayerOperationResult {
    // This will be implemented by the LayerService
    // For now, return a placeholder result
    return {
      success: false,
      layerId: context.layerId,
      error: 'Add missing source recovery not implemented',
      canRetry: false
    };
  }

  /**
   * Retry operation after delay
   */
  private async retryAfterDelay(context: LayerOperation, delay: number): Promise<LayerOperationResult> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: false,
          layerId: context.layerId,
          error: 'Retry mechanism not implemented',
          canRetry: true
        });
      }, delay);
    });
  }

  /**
   * Log error with context
   */
  private logError(error: LayerError, context: LayerOperation): void {
    const errorInfo = {
      type: error.type,
      message: error.message,
      layerId: context.layerId,
      operationType: context.type,
      timestamp: new Date().toISOString(),
      context: error.context
    };

    console.error('Layer operation error:', errorInfo);

    // In a production environment, you might want to send this to an error tracking service
    // this.sendToErrorTracking(errorInfo);
  }

  /**
   * Create a LayerError from various error types
   */
  createError(
    type: LayerError['type'], 
    message: string, 
    layerId?: string, 
    sourceId?: string, 
    context?: any
  ): LayerError {
    return {
      type,
      message,
      layerId,
      sourceId,
      context
    };
  }

  /**
   * Check if an error is recoverable
   */
  isRecoverable(error: LayerError): boolean {
    const recovery = this.determineRecoveryStrategy(error, { type: 'show', layerId: error.layerId || 'unknown' });
    return recovery.canRecover;
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: LayerError): boolean {
    const recovery = this.determineRecoveryStrategy(error, { type: 'show', layerId: error.layerId || 'unknown' });
    return recovery.canRetry;
  }

  /**
   * Get error type description
   */
  getErrorTypeDescription(type: LayerError['type']): string {
    return this.errorTypes[type] || 'Unknown error type';
  }

  /**
   * Validate error structure
   */
  validateError(error: any): error is LayerError {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof error.type === 'string' &&
      typeof error.message === 'string'
    );
  }

  /**
   * Convert generic error to LayerError
   */
  convertError(error: any, layerId?: string): LayerError {
    if (this.validateError(error)) {
      return error;
    }

    // Try to determine error type from error message
    let type: LayerError['type'] = 'INVALID_STATE';
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('not found') || message.includes('does not exist')) {
      if (message.includes('layer')) {
        type = 'LAYER_NOT_FOUND';
      } else if (message.includes('source')) {
        type = 'SOURCE_NOT_FOUND';
      }
    } else if (message.includes('not ready') || message.includes('not loaded')) {
      type = 'MAP_NOT_READY';
    } else if (message.includes('timeout') || message.includes('timed out')) {
      type = 'OPERATION_TIMEOUT';
    } else if (message.includes('dependency') || message.includes('required')) {
      type = 'DEPENDENCY_MISSING';
    }

    return {
      type,
      message,
      layerId,
      context: error
    };
  }
} 