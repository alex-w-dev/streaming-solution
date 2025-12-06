export const getTanksRespounInterval = (level: number): number => {
  const min = 10000 / level;
  const max = 15000 / level;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
