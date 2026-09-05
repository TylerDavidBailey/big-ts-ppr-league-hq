import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

import { installLocalStorage } from './localStorageShim';
import { resetPlayerIndex } from '@/lib/players';

const storage = installLocalStorage();

beforeEach(() => {
  storage.clear();
  resetPlayerIndex();
});

afterEach(() => {
  storage.clear();
});
