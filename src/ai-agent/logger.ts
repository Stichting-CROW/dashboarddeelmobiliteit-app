export class Logger {
    private verbose: boolean;
  
    constructor(verbose: boolean) {
      this.verbose = verbose;
    }
  
    info(message: string): void {
      console.log(`ℹ️  ${message}`);
    }
  
    success(message: string): void {
      console.log(`✅ ${message}`);
    }
  
    error(message: string): void {
      console.error(`❌ ${message}`);
    }
  
    debug(message: string): void {
      if (this.verbose) {
        console.debug(`🔍 ${message}`);
      }
    }
  
    warn(message: string): void {
      console.warn(`⚠️  ${message}`);
    }
  } 