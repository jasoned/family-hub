// Export the appropriate context based on environment
import { useMockAppContext, MockAppProvider } from './MockAppContext';

export const AppProvider = MockAppProvider;
export const useAppContext = useMockAppContext;
