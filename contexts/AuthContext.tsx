import { createContext, ReactNode } from "react";

type SignInCredetials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredetials): Promise<void>;
  isAuthenticated: boolean;
};

export const AuthContext = createContext({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const isAuthenticated = false;
  async function signIn({ email, password }: SignInCredetials) {
    console.log({ email, password });
  }
  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated }}>
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
