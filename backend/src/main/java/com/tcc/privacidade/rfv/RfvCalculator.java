package com.tcc.privacidade.rfv;

/**
 * Contrato do calculo de RFV. Uma interface = uma "promessa" de comportamento.
 * Isso permite trocar a forma de calcular no futuro sem mexer em quem usa o calculo.
 */
public interface RfvCalculator {
    RfvScoreResult calculate(UserActivitySnapshot activity);
}
