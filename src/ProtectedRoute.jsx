import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check if the user is authenticated (e.g., checking localStorage, token, or state)
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"; // Change this based on your auth logic

  if (!isAuthenticated) {
    // If not logged in, redirect them back to the login page
    return <Navigate to="/" replace />;
  }

  // If logged in, render the requested page (e.g., Home)
  return children;
};

export default ProtectedRoute;