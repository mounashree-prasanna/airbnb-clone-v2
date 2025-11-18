import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";

export default function Logout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { role } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const performLogout = async () => {
      await dispatch(logoutUser(role));
      navigate("/login");
    };

    performLogout();
  }, [navigate, dispatch, role]);

  return (
    <div className="flex justify-center items-center min-h-screen text-gray-700 text-lg">
      Logging out...
    </div>
  );
}