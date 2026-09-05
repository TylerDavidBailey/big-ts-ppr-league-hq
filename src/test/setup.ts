import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

import { resetPlayerIndex } from '@/lib/players';

beforeEach(() => {
  resetPlayerIndex();
});
