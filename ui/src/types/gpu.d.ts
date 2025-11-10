declare module 'gpu.js' {
  export interface GPU {
    createKernel(fn: Function): Kernel;
  }
  
  export interface Kernel {
    setOutput(size: number[]): Kernel;
  }
  
  export default class GPU {
    constructor();
    createKernel(fn: Function): Kernel;
  }
}
