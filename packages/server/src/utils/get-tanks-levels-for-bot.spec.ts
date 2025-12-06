import { getTanksLevelsForBot } from './get-tanks-levels-for-bot';

describe('getTanksLevelsForBot', () => {
  it('should return array with sum equal to 63 and all elements between 1 and 11', () => {
    const result = getTanksLevelsForBot(63);
    const sum = result.reduce((acc, val) => acc + val, 0);

    expect(sum).toBe(63);
    expect(result.every((level) => level > 0 && level < 12)).toBe(true);
  });
});

