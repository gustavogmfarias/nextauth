import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue = [];

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
  async (error: AxiosError) => {
    if (error.response.status === 401) {
      if (error.response.data?.code === "token.expired") {
        cookies = parseCookies();

        const { "nextauth.refreshToken": refreshToken } = cookies;
        const originalConfig = error.config;

        if (!isRefreshing) {
          let isRefreshing = true;

          api
            .post("/refresh", { refreshToken })
            .then((response) => {
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

              failedRequestsQueue.forEach((request) =>
                request.onSuccess(token)
              );

              failedRequestsQueue = [];
            })
            .catch((err) => {
              failedRequestsQueue.forEach((request) => request.onFailure(err));
              failedRequestsQueue = [];
            })
            .finally(() => {
              isRefreshing = false;
            });
        }
        //a) primeiro parâmetro é a rota, o segundo é enviar como body o refreshToken
        //b) então pego a resposta que virá em json,
        //c) eu pego o novo token e novo refresh token;
        //d) esse cookie eu vou salvar nos cookies.
        //e) Importante salientar que salvei o novo refresh token como response.data.refreshToken, porque senão iria pegr o refresh token antigo.
        //f) executa o api.defaults.autorization novamente, par atualizar o token jwt que está sendo enviado nas rquisições.
        //g) está funcionando a atualização, porém tá dando um errinho na chamada, pois as requisições anteriores estão sendo feitas com o token anterior
        // também havia duas requisições ao mesmo tempo, ele tentou então fazer duas vezes o refresh token, a segunda deu erro porque já havia uma requisição sendo feita na rota /me que deveriam ter sido feitas a partir do novo refresh token.
        // proximo capitulo explicará esse problema

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers["Authorization"] = `Bearer ${token}`;
              resolve(api(originalConfig));
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            },
          });
        });
        //a) todas as promises javascript tem um resolve e um reject com parametro. Resolve é o que vai acontecer quando o set refresh estiver atualizado. E o reject é tudo caso o processo de set refresh token tenha dado errado.
        //b) dentro do array de failed, dou um push no objeto
        //c) Faço as funções caso de certo ou errado.
      } else {
        //deslogar usuário
        signOut();
      }
    }

    return Promise.reject(error);
  }
);
