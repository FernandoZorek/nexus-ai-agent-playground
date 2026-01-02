import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: any;
}

export abstract class ITool {
  abstract name: string;
  abstract description: string;
  abstract schema: z.ZodTypeAny;

  get parameters() {
    const jsonSchema = zodToJsonSchema(this.schema as any, { 
      target: "openApi3",
      $refStrategy: "none" 
    }) as any;

    const { $schema, definitions, ...cleanSchema } = jsonSchema;

    if (cleanSchema.properties && !cleanSchema.required) {
      cleanSchema.required = Object.keys(cleanSchema.properties);
    }

    return cleanSchema;
  }

  get toolDeclaration(): ToolDeclaration {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters
    };
  }

  abstract execute(args: any): Promise<any>;
}