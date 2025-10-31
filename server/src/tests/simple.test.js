// Simple test to verify the setup works
describe('Basic Setup', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
