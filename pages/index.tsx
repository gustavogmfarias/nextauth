import styles from "../styles/Home.module.css";
import { FormEvent, useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { parseCookies } from "nookies";
import { GetServerSideProps } from "next";
import { withSSRGuest } from "../utils/withSSRGuest";

export default function Home() {
  const [email, setEmail] = useState(" ");
  const [password, setPassword] = useState(" ");

  const { signIn, isAuthenticated } = useContext(AuthContext);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = { email, password };

    await signIn(data);
  } //vai ser disparado quando o formulario for disparado.

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />{" "}
      {/* Toda vez que digitar algo será setado na variável email. e.target.value signifca o evento. */}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Enviar</button> {/* Faz a submição do formulário */}
    </form>
  );
}

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {},
  };
});
