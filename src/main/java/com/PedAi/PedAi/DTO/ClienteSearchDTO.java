package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Cliente;

// DTO para formatar a resposta para a busca de clientes (compatível com Select2)
public class ClienteSearchDTO {

    private Long id;
    private String text; // O Select2 espera um campo "text" para exibição

    public ClienteSearchDTO(Cliente cliente) {
        this.id = cliente.getId();
        this.text = cliente.getNome();
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }
}