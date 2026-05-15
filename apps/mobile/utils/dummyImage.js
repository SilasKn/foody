const dummies = [
  require('../assets/dummy_images/dummy_bowl.png'),
  require('../assets/dummy_images/dummy_salad.png'),
  require('../assets/dummy_images/dummy_tacos.png'),
];

function hashStringToInt(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickDummyImage(recipeId) {
  const key = String(recipeId ?? '');
  return dummies[hashStringToInt(key) % dummies.length];
}
