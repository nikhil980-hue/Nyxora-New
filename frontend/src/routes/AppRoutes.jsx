import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";


import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";


import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";


import Home from "../modules/home/pages/Home";

import Chat from "../modules/chat/pages/Chat";


import Workspace from "../modules/workspace/pages/Workspace";


import PDFGenerator
  from "../modules/workspace/documents/pdfs/PDFGenerator";


import AIMemory
  from "../pages/settings/AIMemory";


import Favorites
  from "../modules/favorites/pages/Favorites";


import Notes
  from "../modules/notes/pages/Notes";


import Presentation
  from "../modules/presentation/pages/Presentation";


import ProtectedRoute from "./ProtectedRoute";



export default function AppRoutes() {


  return (

    <BrowserRouter>


      <Routes>




        {/* AUTH */}


        <Route element={<AuthLayout />}>


          <Route

            path="/"

            element={<Login />}

          />



          <Route

            path="/register"

            element={<Register />}

          />



          <Route

            path="/forgot-password"

            element={<ForgotPassword />}

          />


        </Route>





        {/* DASHBOARD */}


        <Route

          path="/dashboard"

          element={


            <ProtectedRoute>


              <MainLayout>


                <Home />


              </MainLayout>


            </ProtectedRoute>


          }

        />








        {/* PROFILE */}


        <Route

          path="/profile"

          element={


            <ProtectedRoute>


              <MainLayout>


                <Profile />


              </MainLayout>


            </ProtectedRoute>


          }

        />








        {/* AI CHAT */}


        <Route

          path="/chat"

          element={


            <ProtectedRoute>


              <Chat />


            </ProtectedRoute>


          }

        />








        {/* IMAGE STUDIO */}


        <Route

          path="/image-studio"

          element={


            <ProtectedRoute>


              <Chat imageStudio />


            </ProtectedRoute>


          }

        />








        {/* WORKSPACE */}


        <Route

          path="/workspace"

          element={


            <ProtectedRoute>


              <MainLayout>


                <Workspace />


              </MainLayout>


            </ProtectedRoute>


          }

        />








        {/* PDF */}


        <Route

          path="/pdf"

          element={


            <ProtectedRoute>


              <MainLayout>


                <PDFGenerator />


              </MainLayout>


            </ProtectedRoute>


          }

        />








        {/* AI MEMORY */}


        <Route

          path="/ai-memory"

          element={


            <ProtectedRoute>


              <MainLayout>


                <AIMemory />


              </MainLayout>


            </ProtectedRoute>


          }

        />








        {/* FAVORITES */}


        <Route

          path="/favorites"

          element={


            <ProtectedRoute>


              <MainLayout>


                <Favorites />


              </MainLayout>


            </ProtectedRoute>


          }

        />








        {/* NOTES */}


        <Route

          path="/notes"

          element={


            <ProtectedRoute>


              <MainLayout>


                <Notes />


              </MainLayout>


            </ProtectedRoute>


          }

        />








        {/* PRESENTATION */}


        <Route

          path="/presentation"

          element={


            <ProtectedRoute>


              <MainLayout>


                <Presentation />


              </MainLayout>


            </ProtectedRoute>


          }

        />



        {/* 404 */}


        <Route

          path="*"

          element={<NotFound />}

        />



      </Routes>


    </BrowserRouter>

  );

}
