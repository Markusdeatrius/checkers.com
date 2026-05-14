export const calculateElo = (
  ratingA: number,
  ratingB: number,
  actualScore: number,
  gamesPlayedA: number
): number => {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const kFactor = gamesPlayedA < 30 ? 40 : 20;
  const newRating = ratingA + kFactor * (actualScore - expectedA);
  return Math.round(newRating);
};
