import { useState } from "react";
import { quizApi } from "../services/api";
import { useSession } from "../context/SessionContext";

interface Pergunta {
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number;
  explicacao: string;
}

const PERGUNTAS: Pergunta[] = [
  {
    pergunta: "O que a LGPD regula?",
    opcoes: [
      "Somente empresas de tecnologia",
      "A coleta, o uso e o armazenamento de dados pessoais no Brasil",
      "Apenas dados financeiros",
      "Somente dados coletados presencialmente",
    ],
    respostaCorreta: 1,
    explicacao: "A LGPD (Lei 13.709/2018) regula o tratamento de dados pessoais por qualquer organização, pública ou privada, no Brasil.",
  },
  {
    pergunta: "O que é consentimento, segundo a LGPD?",
    opcoes: [
      "Uma caixa marcada por padrão que o usuário nunca precisa ver",
      "Uma manifestação livre, informada e inequívoca do titular",
      "Um termo de uso genérico aceito uma única vez",
      "Uma autorização dada pela empresa, não pelo usuário",
    ],
    respostaCorreta: 1,
    explicacao: "Consentimento válido precisa ser livre, informado e inequívoco - o usuário sabe exatamente para que está autorizando o uso dos dados.",
  },
  {
    pergunta: "Qual destes NÃO é um direito garantido ao titular de dados?",
    opcoes: [
      "Solicitar a eliminação dos seus dados",
      "Exportar os próprios dados (portabilidade)",
      "Impedir qualquer empresa de existir",
      "Revogar o consentimento a qualquer momento",
    ],
    respostaCorreta: 2,
    explicacao: "A LGPD garante direitos sobre os SEUS dados (acesso, correção, eliminação, portabilidade, revogação), não poder sobre a empresa em si.",
  },
  {
    pergunta: "Minimização de dados significa:",
    opcoes: [
      "Coletar o máximo de dados possível, só por precaução",
      "Coletar apenas os dados estritamente necessários para a finalidade informada",
      "Reduzir o tamanho dos arquivos armazenados",
      "Um recurso técnico de compressão de banco de dados",
    ],
    respostaCorreta: 1,
    explicacao: "Minimização é um princípio da LGPD: só coletar o que é realmente necessário para o propósito declarado.",
  },
];

export function Quiz() {
  const { registrarEvento } = useSession();
  const [passo, setPasso] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);

  function responder(indice: number) {
    if (selecionada !== null) return;
    setSelecionada(indice);
    if (indice === PERGUNTAS[passo].respostaCorreta) {
      setAcertos((a) => a + 1);
    }
  }

  async function proxima() {
    if (passo + 1 < PERGUNTAS.length) {
      setPasso((p) => p + 1);
      setSelecionada(null);
    } else {
      setFinalizado(true);
      await quizApi.enviar(acertos, PERGUNTAS.length);
      await registrarEvento("COMPLETE_QUIZ", `score=${acertos}/${PERGUNTAS.length}`);
    }
  }

  if (finalizado) {
    return (
      <section className="page">
        <h1>Quiz concluído!</h1>
        <p>
          Você acertou <strong>{acertos} de {PERGUNTAS.length}</strong> perguntas.
        </p>
        <p>Confira seu histórico completo na página "O que sabemos sobre você".</p>
      </section>
    );
  }

  const atual = PERGUNTAS[passo];

  return (
    <section className="page page-quiz">
      <h1>Quiz: privacidade e LGPD</h1>
      <p className="quiz-progress">Pergunta {passo + 1} de {PERGUNTAS.length}</p>
      <h2>{atual.pergunta}</h2>
      <div className="quiz-options">
        {atual.opcoes.map((opcao, i) => {
          let classe = "quiz-option";
          if (selecionada !== null) {
            if (i === atual.respostaCorreta) classe += " correta";
            else if (i === selecionada) classe += " errada";
          }
          return (
            <button key={i} className={classe} onClick={() => responder(i)} disabled={selecionada !== null}>
              {opcao}
            </button>
          );
        })}
      </div>
      {selecionada !== null && (
        <div className="quiz-feedback">
          <p>{atual.explicacao}</p>
          <button className="cta-button" onClick={proxima}>
            {passo + 1 < PERGUNTAS.length ? "Próxima pergunta" : "Ver resultado"}
          </button>
        </div>
      )}
    </section>
  );
}
