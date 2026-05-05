const KEY = "smartflow_admin_auth";

export const isAdminAuthed = () => sessionStorage.getItem(KEY) === "1";
export const loginAdmin = (user: string, pass: string) => {
  if (user === "admin" && pass === "admin") {
    sessionStorage.setItem(KEY, "1");
    return true;
  }
  return false;
};
export const logoutAdmin = () => sessionStorage.removeItem(KEY);
