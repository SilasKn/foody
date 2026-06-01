import { Image } from 'react-native';

const NO_PICTURE = require('../assets/no-picture.png');

export default function RecipeImage({ imageUrl, style }) {
  return (
    <Image
      source={imageUrl ? { uri: imageUrl } : NO_PICTURE}
      style={style}
      resizeMode="cover"
    />
  );
}
