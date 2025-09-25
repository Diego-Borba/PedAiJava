package com.PedAi.PedAi.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

// DTO para receber dados do frontend para criar/editar uma Conta a Pagar
public class ContaAPagarInputDTO {

    private Long fornecedorId;
    private String descricao;
    private BigDecimal valorTotal;
    private LocalDate dataVencimento;

    // Getters e Setters
    public Long getFornecedorId() {
        return fornecedorId;
    }

    public void setFornecedorId(Long fornecedorId) {
        this.fornecedorId = fornecedorId;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }

    public LocalDate getDataVencimento() {
        return dataVencimento;
    }

    public void setDataVencimento(LocalDate dataVencimento) {
        this.dataVencimento = dataVencimento;
    }
}