import { createContext, useContext, useState } from 'react';
import type { Provider } from './types';

interface Ctx {
  provider: Provider | '';
  setProvider: (p: Provider | '') => void;
}

const ProviderContext = createContext<Ctx>({ provider: '', setProvider: () => {} });

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<Provider | ''>('');
  return <ProviderContext.Provider value={{ provider, setProvider }}>{children}</ProviderContext.Provider>;
}

export function useProvider() {
  return useContext(ProviderContext);
}

