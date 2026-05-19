import { RefObject } from 'react';
import { ScrollView } from 'react-native';

const registry: Record<string, RefObject<ScrollView | null>> = {};

export function registerScroll(name: string, ref: RefObject<ScrollView | null>) {
  registry[name] = ref;
}

export function scrollTabToTop(name: string) {
  registry[name]?.current?.scrollTo({ y: 0, animated: true });
}
