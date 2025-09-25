package com.PedAi.PedAi.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

// DTO para receber dados do frontend para criar/editar uma Conta a Receber
public class ContaAReceberInputDTO {

    private Long clienteId;
    private String clienteNomeAvulso; // Para clientes não cadastrados
    private String origem;
    private BigDecimal valorTotal;
    private LocalDate dataVencimento;

    // Getters e Setters
    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getClienteNomeAvulso() {
        return clienteNomeAvulso;
    }

    public void setClienteNomeAvulso(String clienteNomeAvulso) {
        this.clienteNomeAvulso = clienteNomeAvulso;
    }

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
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