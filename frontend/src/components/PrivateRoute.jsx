import { Navigate } from "react-router-dom"

const PrivateRoute = ({ token, children }) => {
  const sessionToken = sessionStorage.getItem("token")
  return sessionToken || token ? children : <Navigate to="/signin" />
}

export default PrivateRoute
