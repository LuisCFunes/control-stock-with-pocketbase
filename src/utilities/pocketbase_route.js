import PocketBase from "pocketbase";

export const pb = new PocketBase(import.meta.env.VITE_APP_PB_URL);

export const initAuth = async () => {
  const mail = import.meta.env.VITE_APP_MAIL;
  const password = import.meta.env.VITE_APP_PASSWORD;

  if (mail && password) {
    await pb.admins.authWithPassword(mail, password);
    return;
  }

  throw new Error(
    "No se pudo inicializar la autenticación: faltan VITE_APP_MAIL / VITE_APP_PASSWORD",
  );
};
