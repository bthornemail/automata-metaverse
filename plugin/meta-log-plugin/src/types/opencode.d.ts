/**
 * OpenCode plugin type definitions
 */

declare module '@opencode-ai/plugin' {
  export interface Tool {
    description: string;
    args: any;
    execute: (args: any, context: any) => Promise<any>;
  }

  export function tool(config: {
    description: string;
    args: any;
    execute: (args: any, context: any) => Promise<any>;
  }): Tool;

  export namespace tool {
    export namespace schema {
      export function string(): StringSchema;
      export function number(): NumberSchema;
      export function boolean(): BooleanSchema;
      export function object(): ObjectSchema;
      export function array(): ArraySchema;
    }
  }

  export interface StringSchema {
    describe(description: string): StringSchema;
    optional(): StringSchema;
  }

  export interface NumberSchema {
    describe(description: string): NumberSchema;
    optional(): NumberSchema;
  }

  export interface BooleanSchema {
    describe(description: string): BooleanSchema;
    optional(): BooleanSchema;
  }

  export interface ObjectSchema {
    describe(description: string): ObjectSchema;
    optional(): ObjectSchema;
  }

  export interface ArraySchema {
    describe(description: string): ArraySchema;
    optional(): ArraySchema;
  }
}
