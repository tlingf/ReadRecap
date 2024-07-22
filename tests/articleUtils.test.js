import { isArticle, formatTime } from '../src/utils/articleUtils';

describe('isArticle', () => {
  test('returns true for URLs with date patterns', () => {
    expect(isArticle('https://example.com/2023/05/20/some-article')).toBe(true);
  });

  test('returns true for known article domains', () => {
    expect(isArticle('https://medium.com/some-article')).toBe(true);
    expect(isArticle('https://substack.com/some-article')).toBe(true);
  });

  test('returns false for Google Colab URLs', () => {
    expect(isArticle('https://colab.research.google.com/some-notebook')).toBe(false);
  });
});

describe('formatTime', () => {
  test('formats time correctly for less than 60 minutes', () => {
    expect(formatTime(30)).toBe('30 minutes');
  });

  test('formats time correctly for 60 or more minutes', () => {
    expect(formatTime(60)).toBe('60+ minutes');
    expect(formatTime(120)).toBe('60+ minutes');
  });
});
