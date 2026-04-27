import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AddRecipeScreen from './screens/AddRecipeScreen';
import CalendarScreen from './screens/CalendarScreen';
import LoginScreen from './screens/LoginScreen';
import RecipesScreen from './screens/RecipesScreen';
import StartScreen from './screens/StartScreen';
import { colors } from './theme';
import { AuthProvider, useAuth } from './providers/AuthProvider';

const Stack = createNativeStackNavigator();

function AppRoutes() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.cream,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <Stack.Navigator
          initialRouteName="Start"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Recipes" component={RecipesScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen
            name="AddRecipe"
            component={AddRecipeScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppRoutes />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
