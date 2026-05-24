import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/index.js'
import { setUnauthorizedListener } from './api/api.service.js'
import { sessionFailure } from './store/slices/auth.slice.js'
import { clearContext } from './store/slices/context.slice.js'
import './index.css'
import App from './App.jsx'

setUnauthorizedListener(() => {
  store.dispatch(clearContext());
  store.dispatch(sessionFailure());
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
