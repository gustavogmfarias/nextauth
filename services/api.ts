import axios, { AxiosError } from "axios";
import { GetServerSidePropsContext } from "next";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false;
let failedRequestsQueue = [];

interface AxiosErrorResponse {
  code?: string;
}

export function setupAPIClient(
  ctx: GetServerSidePropsContext | undefined = undefined
) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["nextauth.token"]}`,
    },
  });

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError<AxiosErrorResponse>) => {
      if (error.response.status === 401) {
        if (error.response.data?.code === "token.expired") {
          cookies = parseCookies(ctx);

          const { "nextauth.refreshToken": refreshToken } = cookies;
          const originalConfig = error.config;

          if (!isRefreshing) {
            isRefreshing = true;

            api
              .post("/refresh", { refreshToken })
              .then((response) => {
                const { token } = response.data;

                setCookie(ctx, "nextauth.token", token, {
                  maxAge: 60 * 60 * 24 * 30, //30 dias
                  path: "/",
                });

                setCookie(
                  ctx,
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
                failedRequestsQueue.forEach((request) =>
                  request.onFailure(err)
                );
                failedRequestsQueue = [];

                if (process.browser) {
                  signOut();
                }
              })
              .finally(() => {
                isRefreshing = false;
              });
          }
          //a) primeiro par??metro ?? a rota, o segundo ?? enviar como body o refreshToken
          //b) ent??o pego a resposta que vir?? em json,
          //c) eu pego o novo token e novo refresh token;
          //d) esse cookie eu vou salvar nos cookies.
          //e) Importante salientar que salvei o novo refresh token como response.data.refreshToken, porque sen??o iria pegr o refresh token antigo.
          //f) executa o api.defaults.autorization novamente, par atualizar o token jwt que est?? sendo enviado nas rquisi????es.
          //g) est?? funcionando a atualiza????o, por??m t?? dando um errinho na chamada, pois as requisi????es anteriores est??o sendo feitas com o token anterior
          // tamb??m havia duas requisi????es ao mesmo tempo, ele tentou ent??o fazer duas vezes o refresh token, a segunda deu erro porque j?? havia uma requisi????o sendo feita na rota /me que deveriam ter sido feitas a partir do novo refresh token.
          // proximo capitulo explicar?? esse problema

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
          //a) todas as promises javascript tem um resolve e um reject com parametro. Resolve ?? o que vai acontecer quando o set refresh estiver atualizado. E o reject ?? tudo caso o processo de set refresh token tenha dado errado.
          //b) dentro do array de failed, dou um push no objeto
          //c) Fa??o as fun????es caso de certo ou errado.
        } else {
          //deslogar usu??rio
          if (process.browser) {
            signOut();
          } else {
            return Promise.reject(new AuthTokenError());
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
}
