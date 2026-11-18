import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<img src=x onerror="alert(\'1\')">&'))
      .toBe('&lt;img src=x onerror=&quot;alert(&#039;1&#039;)&quot;&gt;&amp;');
  });

  it('returns an empty string for null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('stringifies non-string values', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});
