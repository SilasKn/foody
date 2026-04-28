import { ScrollView, Text } from 'react-native';
import ScreenShell from '../components/ScreenShell';

export default function CalendarScreen({ navigation }) {
  return (
    <ScreenShell
      navigation={navigation}
      activeTab="calendar"
    >
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            alignSelf: 'stretch',
            textAlign: 'left',
            fontSize: 32,
            fontWeight: '700',
            marginTop: 6,
            marginBottom: 16,
          }}
        >
          Welcome to the calendar page
        </Text>
      </ScrollView>
    </ScreenShell>
  );
}
