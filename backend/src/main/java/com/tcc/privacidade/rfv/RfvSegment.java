package com.tcc.privacidade.rfv;

/**
 * "Perfil" do usuario de acordo com o codigo RFV calculado.
 * OUTRO_PERFIL cobre qualquer combinacao que nao bata com os 5 perfis fixos.
 */
public enum RfvSegment {
    CAMPEAO,
    RECEM_CHEGADO,
    FIEL_EM_RISCO,
    ENGAJADO_SUPERFICIAL,
    INATIVO,
    OUTRO_PERFIL
}
