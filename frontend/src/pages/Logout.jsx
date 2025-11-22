import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";

export default function Logout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const logoutAndRedirect = async () => {
      try {
        await dispatch(logoutUser()).unwrap();
      } catch (err) {
        console.error("Logout failed:", err);
      } finally {
        navigate("/login");
      }
    };

    logoutAndRedirect();
  }, [dispatch, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen text-gray-700 text-lg">
      Logging out...
    </div>
  );
}