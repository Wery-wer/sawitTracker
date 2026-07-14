import React from 'react';
import { StatusBar, Platform, Text, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, DashboardScreen, InputPanenScreen } from './src/screens';
import { COLORS, FONTS } from './src/constants/theme';

// Set Global Default Font Family matching Web App (Tailwind font-sans)
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.style = { fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) };

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.style = { fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) };

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#0F172A',
            headerTitleStyle: {
              ...FONTS.extrabold,
              fontSize: 17,
              color: '#0F172A',
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="InputPanen" 
            component={InputPanenScreen} 
            options={{ headerShown: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
