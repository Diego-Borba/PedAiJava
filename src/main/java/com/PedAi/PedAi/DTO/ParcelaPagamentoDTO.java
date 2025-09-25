package com.PedAi.PedAi.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ParcelaPagamentoDTO {
    private BigDecimal valor;
    private LocalDate dataVencimento;

    // Getters e Setters
    public BigDecimal getValor() {
        return valor;
    }
    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }
    public LocalDate getDataVencimento() {
        return dataVencimento;
    }
    public void setDataVencimento(LocalDate dataVencimento) {
        this.dataVencimento = dataVencimento;
    }
}