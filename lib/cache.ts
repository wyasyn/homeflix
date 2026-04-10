import AsyncStorage from "@react-native-async-storage/async-storage";
import { CACHE_TTL } from "./constants";

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Silently fail — cache is best-effort
  }
}

export async function isCacheValid(timestampKey: string): Promise<boolean> {
  try {
    const timestamp = await AsyncStorage.getItem(timestampKey);
    if (!timestamp) return false;
    return Date.now() - Number(timestamp) < CACHE_TTL;
  } catch {
    return false;
  }
}

export async function setCacheTimestamp(timestampKey: string): Promise<void> {
  try {
    await AsyncStorage.setItem(timestampKey, String(Date.now()));
  } catch {
    // Silently fail
  }
}
