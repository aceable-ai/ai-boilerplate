import { exampleTask } from '../../src/ai/tasks/exampleTask';
import { z } from 'zod';

describe('exampleTask contract', () => {
  it('validates fallback output shape', () => {
    const input = { input: 'Hello world!' };
    const result = exampleTask.fallback!(input);
    expect(() => exampleTask.schema.parse(result)).not.toThrow();
    expect(result.result).toContain('Hello');
  });
});
