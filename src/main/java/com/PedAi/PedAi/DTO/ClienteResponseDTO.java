package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.Endereco;

public class ClienteResponseDTO {

    private Long id;
    private String nome;
    private String email;
    private String telefone;
    private Endereco endereco;

    public ClienteResponseDTO(Cliente cliente) {
        this.id = cliente.getId();
        this.nome = cliente.getNome();
        this.email = cliente.getEmail();
        this.telefone = cliente.getTelefone();
        this.endereco = cliente.getEndereco();
    }

    public Long getId() {
        return id;
}

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public Endereco getEndereco() {
        return endereco;
    }

    public void setEndereco(Endereco endereco) {
        this.endereco = endereco;
    }
}
