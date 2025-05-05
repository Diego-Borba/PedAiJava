package com.PedAi.PedAi.DTO;

import java.util.List;

public class EntradaDTO {
    private Long fornecedorId;
    private String tipoDocumento;
    private List<EntradaItemDTO> itens;

    // Getters e Setters

    public Long getFornecedorId() {
        return fornecedorId;
    }

    public void setFornecedorId(Long fornecedorId) {
        this.fornecedorId = fornecedorId;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public List<EntradaItemDTO> getItens() {
        return itens;
    }

    public void setItens(List<EntradaItemDTO> itens) {
        this.itens = itens;
    }
}
