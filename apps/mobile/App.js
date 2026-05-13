import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AddRecipeScreen from './screens/AddRecipeScreen';
import ScheduleRecipeScreen from './screens/ScheduleRecipeScreen';
import RescheduleScreen from './screens/RescheduleScreen';
import CalendarScreen from './screens/CalendarScreen';
import LoginScreen from './screens/LoginScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import RecipesScreen from './screens/RecipesScreen';
import StartScreen from './screens/StartScreen';
import { colors } from './theme';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { RecipesProvider } from './providers/RecipesProvider';

SplashScreen.preventAutoHideAsync();

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
          <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
          <Stack.Screen
            name="ScheduleRecipe"
            component={ScheduleRecipeScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen
            name="Reschedule"
            component={RescheduleScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen
            name="AddRecipe"
            component={AddRecipeScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'none',
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
  const [fontsLoaded] = useFonts({
    'Poppins-Light':    Poppins_300Light,
    'Poppins-Regular':  Poppins_400Regular,
    'Poppins-Medium':   Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SafeAreaProvider>
          <RecipesProvider>
            <AppRoutes />
            <StatusBar style="dark" />
          </RecipesProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
