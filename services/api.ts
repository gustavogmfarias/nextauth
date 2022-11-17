import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";

let cookies = parseCookies();

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    Authorization: `Bearer ${cookies["nextauth.token"]}`,
  },
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response.status === 401) {
      if (error.response.data?.code === "token.expired") {
        cookies = parseCookies();

        const { "nextauth.refreshToken": refreshToken } = cookies;

        api.post("/refresh", { refreshToken }).then((response) => {
          const { token } = response.data.token;

          setCookie(undefined, "nextauth.token", response.data.token, {
            maxAge: 60 * 60 * 24 * 30, //30 dias
            path: "/",
          });

          setCookie(
            undefined,
            "nextauth.refreshToken",
            response.data.refreshToken,
            {
              maxAge: 60 * 60 * 24 * 30, //30 dias
              path: "/",
            }
          );

          api.defaults.headers["Authorization"] = `Bearer ${token}`;
        });
        //a) primeiro parâmetro é a rota, o segundo é enviar como body o refreshToken
        //b) então pego a resposta que virá em json,
        //c) eu pego o novo token e novo refresh token;
        //d) esse cookie eu vou salvar nos cookies.
        //e) Importante salientar que salvei o novo refresh token como response.data.refreshtoken, porque senão iria pegr o refresh token antigo.
        //f) executa o api.defaults.autorization novamente, par atualizar o token jwt que está sendo enviado nas rquisições.
      } else {
        //deslogar usuário
      }
    }
  }
);
