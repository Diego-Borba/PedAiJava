package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Fornecedor;

// DTO para formatar a resposta para a busca de fornecedores (compatível com Select2)
public class FornecedorSearchDTO {

    private Long id;
    private String text; // O Select2 espera um campo "text" para exibição

    public FornecedorSearchDTO(Fornecedor fornecedor) {
        this.id = fornecedor.getId();
        this.text = fornecedor.getNome();
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }
}