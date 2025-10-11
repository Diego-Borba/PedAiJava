package com.PedAi.PedAi.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PagamentoDTO {
    private BigDecimal valor;
    private LocalDate dataPagamento;
    private String forma; // Novo campo para forma de pagamento

    // Getters e Setters
    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public LocalDate getDataPagamento() {
        return dataPagamento;
    }

    public void setDataPagamento(LocalDate dataPagamento) {
        this.dataPagamento = dataPagamento;
    }

    public String getForma() {
        return forma;
    }

    public void setForma(String forma) {
        this.forma = forma;
    }
}