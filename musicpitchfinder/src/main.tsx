import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wrapper from "./pages/Wrapper";
import UI_page2 from "./UI_page2";
import UI_page3 from "./UI_page3";
import { ChakraProvider ,defaultSystem} from '@chakra-ui/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'//React Routerのインポート

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
          <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/UI_page2" element={<UI_page2 />} />
          <Route path="/UI_page3" element={<UI_page3 />} />
          <Route
            path="/dashboard"
            element={
              <Wrapper>
                <Dashboard />
              </Wrapper>
            }
          />
          </Routes>
      </BrowserRouter>
   </ChakraProvider>
  </StrictMode>,
)