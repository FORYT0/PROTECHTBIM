import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
export type MainTabParamList = {
  Home: undefined;
  Projects: undefined;
  Activity: undefined;
  More: undefined;
};

// ─── Root Stack (wraps tabs + pushed screens) ────────────────────────────────
export type RootStackParamList = {
  MainTabs: undefined;
  ProjectDetail: {projectId: string};
  CostTracking:  {projectId?: string};
  Contracts:     {projectId?: string};
  ChangeOrders:  {projectId?: string};
  DailyReports:  {projectId?: string};
  Snags:         {projectId?: string};
  TimeTracking:  {projectId?: string};
  Resources:     undefined;
  Board:         {projectId?: string};
  Calendar:      undefined;
  Wiki:          {projectId?: string};
  WorkPackages:  {projectId?: string};
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;
