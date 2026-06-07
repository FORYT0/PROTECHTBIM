import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import {useAuth} from '../contexts/AuthContext';
import {COLORS, RADIUS, SPACING} from '../utils/theme';

import {LoginScreen}    from '../screens/auth/LoginScreen';
import {RegisterScreen} from '../screens/auth/RegisterScreen';
import {HomeScreen}     from '../screens/home/HomeScreen';
import {ProjectsScreen} from '../screens/projects/ProjectsScreen';
import {ActivityScreen} from '../screens/activity/ActivityScreen';
import {MoreScreen}     from '../screens/more/MoreScreen';
import {ProjectDetailScreen}    from '../screens/projects/ProjectDetailScreen';
import {CostTrackingScreen}     from '../screens/costs/CostTrackingScreen';
import {ContractsScreen}        from '../screens/contracts/ContractsScreen';
import {ChangeOrdersScreen}     from '../screens/changeorders/ChangeOrdersScreen';
import {DailyReportsScreen}     from '../screens/reports/DailyReportsScreen';
import {SnagsScreen}            from '../screens/snags/SnagsScreen';
import {TimeTrackingScreen}     from '../screens/time/TimeTrackingScreen';
import {ResourcesScreen}        from '../screens/resources/ResourcesScreen';
import {BoardScreen}            from '../screens/board/BoardScreen';
import {CalendarScreen}         from '../screens/calendar/CalendarScreen';
import {WikiScreen}             from '../screens/wiki/WikiScreen';
import {WorkPackagesScreen}     from '../screens/workpackages/WorkPackagesScreen';

import type {AuthStackParamList, MainTabParamList, RootStackParamList} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab       = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// ─── Tab icon ─────────────────────────────────────────────────────────────────
function TabIcon({name, label, focused}: {name: string; label: string; focused: boolean}) {
  return (
    <View style={styles.tabIcon}>
      <Feather
        name={name}
        size={22}
        color={focused ? COLORS.blue : COLORS.textMuted}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

// ─── Bottom tabs ──────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:    false,
        tabBarStyle:    styles.tabBar,
        tabBarShowLabel:false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{tabBarIcon: ({focused}) => <TabIcon name="home"      label="Home"     focused={focused} />}}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{tabBarIcon: ({focused}) => <TabIcon name="briefcase" label="Projects" focused={focused} />}}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{tabBarIcon: ({focused}) => <TabIcon name="activity"  label="Activity" focused={focused} />}}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{tabBarIcon: ({focused}) => <TabIcon name="grid"      label="More"     focused={focused} />}}
      />
    </Tab.Navigator>
  );
}

// ─── Auth navigator ───────────────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Loading splash ───────────────────────────────────────────────────────────
function LoadingSplash() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashIcon}>
        <Feather name="layers" size={32} color="#fff" />
      </View>
      <Text style={styles.splashTitle}>PROTECHT BIM</Text>
      <Text style={styles.splashSub}>Construction Intelligence Platform</Text>
      <ActivityIndicator color={COLORS.blue} style={{marginTop: 32}} />
    </View>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────
export function AppNavigator() {
  const {isAuthenticated, isLoading} = useAuth();
  if (isLoading) { return <LoadingSplash />; }
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle:      {backgroundColor: COLORS.surface},
          headerTintColor:  COLORS.textPrimary,
          headerTitleStyle: {fontWeight: '700', color: COLORS.textPrimary},
          headerBackTitleVisible: false,
        }}>
        <RootStack.Screen name="MainTabs"      component={MainTabs}           options={{headerShown: false}} />
        <RootStack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{title: 'Project'}} />
        <RootStack.Screen name="CostTracking"  component={CostTrackingScreen}  options={{title: 'Cost Tracking'}} />
        <RootStack.Screen name="Contracts"     component={ContractsScreen}     options={{title: 'Contracts'}} />
        <RootStack.Screen name="ChangeOrders"  component={ChangeOrdersScreen}  options={{title: 'Change Orders'}} />
        <RootStack.Screen name="DailyReports"  component={DailyReportsScreen}  options={{title: 'Daily Reports'}} />
        <RootStack.Screen name="Snags"         component={SnagsScreen}         options={{title: 'Snags'}} />
        <RootStack.Screen name="TimeTracking"  component={TimeTrackingScreen}  options={{title: 'Time Tracking'}} />
        <RootStack.Screen name="Resources"     component={ResourcesScreen}     options={{title: 'Resources'}} />
        <RootStack.Screen name="Board"         component={BoardScreen}         options={{title: 'Board'}} />
        <RootStack.Screen name="Calendar"      component={CalendarScreen}      options={{title: 'Calendar'}} />
        <RootStack.Screen name="Wiki"          component={WikiScreen}          options={{title: 'Wiki'}} />
        <RootStack.Screen name="WorkPackages"  component={WorkPackagesScreen}  options={{title: 'Work Packages'}} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  splashIcon: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.blue,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.blue, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: {width: 0, height: 8},
    elevation: 12,
  },
  splashTitle: {fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 1.5},
  splashSub:   {fontSize: 13, color: COLORS.textMuted, marginTop: 6},
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor:  COLORS.border,
    borderTopWidth:  1,
    height:          64,
    paddingBottom:   8,
  },
  tabIcon:        {alignItems: 'center', paddingTop: 4},
  tabLabel:       {fontSize: 10, color: COLORS.textMuted, marginTop: 3},
  tabLabelFocused:{color: COLORS.blue},
});
