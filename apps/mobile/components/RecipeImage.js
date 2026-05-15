import { Image, View } from 'react-native';
import { colors } from '../theme';
import { pickDummyImage } from '../utils/dummyImage';

export default function RecipeImage({ imageUrl, recipeId, style }) {
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={style} resizeMode="cover" />;
  }
  return (
    <View style={[style, { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
      <Image
        source={pickDummyImage(recipeId)}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}
