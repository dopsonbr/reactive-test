import { RouterProvider } from 'react-router-dom';
import { Providers } from './providers';
import { router } from './router';

import '../styles.css';

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
