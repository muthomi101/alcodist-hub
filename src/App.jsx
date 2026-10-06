// src/App.jsx
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";

import { Analytics } from "@vercel/analytics/react";

// Alcodist Hub
import Layout from "./components/Layout.jsx";

//blog
import RazorBlogsLanding from "./pages/blogs/RazorBlogsLanding";
import BlogDetails from "./pages/blogs/BlogDetails";
// Author Auth
import AuthorLogin from "./pages/blogs/AuthorLogin";
import AuthorProfileEdit from "./pages/blogs/AuthorProfileEdit";
import AuthorDashboard from "./pages/blogs/AuthorDashboard";
import NewBlog from "./pages/blogs/NewBlog";
import EditBlog from "./pages/blogs/EditBlog";
import AuthorProfile from "./pages/blogs/AuthorProfile";

// Not Found
import NotFound from "./pages/NotFound";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      {/* Home */}
      <Route index element={<RazorBlogsLanding />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />

      {/* blogs */}
      <Route path="/blogs" element={<RazorBlogsLanding />} />
      <Route path="/blogs/:id" element={<BlogDetails />} />
      <Route path="/blogs/new" element={<NewBlog />} />
      <Route path="/blogs/:id/edit" element={<EditBlog />} />

      {/* Author Auth */}
      <Route path="/authors/login" element={<AuthorLogin />} />
      <Route path="/authors/edit/:id" element={<AuthorProfileEdit />} />
      <Route path="/authors/:id" element={<AuthorProfile />} />

      {/* Public author profile */}
      <Route path="/authors/public/:id" element={<AuthorProfile />} />

      <Route path="/authors/dashboard" element={<AuthorDashboard />} />
    </Route>
  )
);

const App = () => {
  return (
    <div>
      <RouterProvider router={router} />
      <Analytics />
    </div>
  );
};

export default App;
