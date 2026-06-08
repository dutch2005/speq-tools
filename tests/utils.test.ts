import { test, expect, describe } from 'bun:test';
import { specBaseName } from '../src/utils.js';

describe('utils.specBaseName — separator-agnostic spec base name', () => {
  test('strips directory and .speq from a POSIX path', () => {
    expect(specBaseName('/home/u/projects/shop.speq')).toBe('shop');
  });
  test('strips directory and .speq from a Windows backslash path', () => {
    // Would break with split('/') (returns the whole drive path) regardless of OS.
    expect(specBaseName('C:\\Users\\u\\projects\\shop.speq')).toBe('shop');
  });
  test('handles a Windows forward-slash path', () => {
    expect(specBaseName('C:/Users/u/projects/shop.speq')).toBe('shop');
  });
  test('handles a bare filename', () => {
    expect(specBaseName('shop.speq')).toBe('shop');
  });
  test('handles a path without the .speq suffix', () => {
    expect(specBaseName('C:\\Users\\u\\shop')).toBe('shop');
  });
});
