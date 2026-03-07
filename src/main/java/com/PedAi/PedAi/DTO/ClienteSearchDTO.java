package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Cliente;

public class ClienteSearchDTO {

    private Long id;
    private String text; 

    public ClienteSearchDTO(Cliente cliente) {
        this.id = cliente.getId();
        this.text = cliente.getNome();
    }

    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }
}