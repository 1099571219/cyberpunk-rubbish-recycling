import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import router from '@/router'
import { RouterProvider } from 'react-router-dom'
// main.ts
import 'virtual:uno.css'
import '@unocss/reset/normalize.css'
import '@/assets/css/reset.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <RouterProvider router={router}></RouterProvider>
  // </React.StrictMode>,
)
