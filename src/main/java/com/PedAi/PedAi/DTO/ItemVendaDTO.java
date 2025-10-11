package com.PedAi.PedAi.DTO;

import java.math.BigDecimal;

public class ItemVendaDTO {
    
    private Long id; // Corresponde ao ID do produto
    private String nome;
    private int quantidade;
    private BigDecimal precoUnitario;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
    public BigDecimal getPrecoUnitario() { return precoUnitario; }
    public void setPrecoUnitario(BigDecimal precoUnitario) { this.precoUnitario = precoUnitario; }
}