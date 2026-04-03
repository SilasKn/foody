import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import ScreenShell from '../components/ScreenShell';
import { supabase } from '../utils/supabase';

export default function StartScreen({ navigation }) {
  // Example data read (used to validate Supabase connectivity).
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const getTodos = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const { data, error } = await supabase.from('todos').select('*');
        if (error) {
          if (!isMounted) return;
          setErrorMessage(error.message);
          setTodos([]);
          return;
        }

        if (!isMounted) return;
        setTodos(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(err?.message ?? 'Failed to load todos');
        setTodos([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    getTodos();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScreenShell
      navigation={navigation}
      title="Welcome to the starting page"
      activeTab="home"
    >
      <View style={{ width: '100%', marginTop: 16 }}>
        {isLoading ? (
          <Text>Loading todos…</Text>
        ) : errorMessage ? (
          <Text style={{ color: '#B00020', fontWeight: '600' }}>{errorMessage}</Text>
        ) : todos.length === 0 ? (
          <Text>No todos found.</Text>
        ) : (
          <FlatList
            data={todos}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Text style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#DDD' }}>
                {item.name ?? item.title ?? String(item.id)}
              </Text>
            )}
          />
        )}
      </View>
    </ScreenShell>
  );
}
