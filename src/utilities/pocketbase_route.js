import PocketBase from "pocketbase";

export const pb = new PocketBase(import.meta.env.VITE_APP_PB_URL);

export const authData = await pb.admins.authWithPassword(
  import.meta.env.VITE_APP_MAIL,
  import.meta.env.VITE_APP_PASSWORD,
);

export const accessToken = authData.token;

console.log(pb.authStore.isValid);
console.log(pb.authStore.token);
console.log(pb.authStore.model.id);
