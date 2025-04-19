import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {Auth} from '@supabase/auth-ui-react'
import {supabase} from './supabaseClient'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Auth.UserContextProvider supabaseClient={supabase}>
            <App/>
        </Auth.UserContextProvider>
    </StrictMode>,
)
