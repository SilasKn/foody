import ScreenShell from '../components/ScreenShell';

export default function CalendarScreen({ navigation }) {
  return (
    <ScreenShell
      navigation={navigation}
      title="Welcome to the calendar page"
      activeTab="calendar"
    />
  );
}
