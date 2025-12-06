export const getTanksLevelsForBot = (level: number): number[] => {
  const tanks: number[] = [];

  while (level > 0) {
    const randomLevel = Math.floor(Math.random() * Math.min(level, 11)) + 1;
    level -= randomLevel;
    tanks.push(randomLevel);
  }

  return tanks;
};
