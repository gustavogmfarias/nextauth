import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import { setCookie, parseCookies, destroyCookie } from "nookies";
import Router from "next/router";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredetials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredetials): Promise<void>;
  user?: User;
  isAuthenticated: boolean;
};

export const AuthContext = createContext({} as AuthContextData);

export function signOut() {
  destroyCookie(undefined, "nextauth.token");
  destroyCookie(undefined, "nextauth.refreshToken");
  Router.push("/");
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();

  const isAuthenticated = !!user;

  useEffect(() => {
    const { "nextauth.token": token } = parseCookies();

    if (token) {
      const response = api
        .get("/me")
        .then((response) => {
          const { email, permissions, roles } = response.data;
          setUser({ email, permissions, roles });
        }) //rota /me porque nesse backend específico é a rota que retorna os dados do usuário logado..
        .catch((error) => {
          signOut();
        });
    }
  }, []);

  //a) Deixo o array de dependências vazio, porque quero que seja carregado somente uma vez.
  //b) Depois eu pego o token, faço uma requisiçaõ a api e guardo as informações do usuário.
  //c) se a gente for no jwt.io e jogar o token la, também temos as informações do usuário dentro do payload. Para autenticação tradicional serviria, mas com oestou lidando com permissões e cargos, coisas que pdoem mudar, eu prefiro recarregar as informações cada vez que o usuário acessa a página.. Haverá uma requisição sim a mais, mas vou garantir que vou ter as permisões e roles do usuários atualizados. SE não tivesse isso, poderia pegar direto do token.

  async function signIn({ email, password }: SignInCredetials) {
    try {
      const response = await api.post("sessions", { email, password }); //rota sessions depois os dados email e password

      const { token, refreshToken, permissions, roles } = response.data;

      setCookie(undefined, "nextauth.token", token, {
        maxAge: 60 * 60 * 24 * 30, //30 dias
        path: "/",
      });

      setCookie(undefined, "nextauth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, //30 dias
        path: "/",
      });

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers["Authorization"] = `Bearer ${token}`;

      Router.push("/dashboard");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}

//CRIAÇÃO DO CONTEXTO INÍCIO

// a) cria o contexto com um objeto vazio mesmo: const AuthContext = createContext({});

//b) cria uma tipagem, pode ser type ou interface. São as informações que vão ter dentro do contexto.
// dentro de type coloco que vai ter um metodo chamado signIn que vai receber o login e a senha, ou seja, as credenciais:  type AuthContextData = {
//     signIn(credentials): Promise<void>;
// };
//O signin vai fazer uma chamada para api e vai retornar uma promise void.
//o Método signIn entra dentro do contexto, porque mais de uma página pode precisar da credencial dos usuários. Embora tenha apenas uma tela de login, outras páginas podem precisar que o usuáiro se autentique.

//c) Será a tipagem, o que vai ter dentro de credentials.
//d) coloco ela no signIn

// e) Outra informação necessária é se o usuário está autenticado ou não, por isso coloca-se na tipagem um isAuthenticated.

//f) coloca no contexto que ele é do tipo AuthContextData, pra quando for usar o contexo, o intellisense já entende quais informações se pode buscar de dentro do contexto.

//g) cria a função authprovider que vai receber um children, que é todas os componentes e páginas que estão dentro quando for la pro _app.
//h) ela retorna o provider com o value e com o children
//i) dentro do value entra o signIn e o isAuthenticated
//j) isAuthenticated começa como false;
//l) A function signIn precisa ser assíncrona para retorna a promise.

// m) Cria um authProviderProps, pra falar que o authProvider recebe uma prop children do tipo reactnode.

//n) No _app engloba tudo com o authprovider. Lembrando que o _app é onde colocamos tudo que queremos compartilhar com tdas as páginas.
//aogra todas as páginas já vai ter informação sobre metodos de autenticação e usuario logado, etc.

//CRIAÇÃO DO CONTEXTO FIM
