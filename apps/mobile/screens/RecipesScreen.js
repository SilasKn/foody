import ScreenShell from '../components/ScreenShell';

export default function RecipesScreen({ navigation }) {
  return (
    <ScreenShell
      navigation={navigation}
      title="Welcome to the recipes page"
      activeTab="recipes"
    />
  );
}
