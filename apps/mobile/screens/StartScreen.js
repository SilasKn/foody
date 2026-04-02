import ScreenShell from '../components/ScreenShell';

export default function StartScreen({ navigation }) {
  return (
    <ScreenShell
      navigation={navigation}
      title="Welcome to the starting page"
      activeTab="home"
    />
  );
}
