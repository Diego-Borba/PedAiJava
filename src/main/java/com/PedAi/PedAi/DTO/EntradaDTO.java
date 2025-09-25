package com.PedAi.PedAi.DTO;

import java.math.BigDecimal;
import java.util.List;

public class EntradaDTO {
    private Long fornecedorId;
    private String tipoDocumento;
    private List<EntradaItemDTO> itens;
    
    // CAMPOS ADICIONADOS
    private BigDecimal valorTotalDocumento;
    private String formaPagamento;
    private List<ParcelaPagamentoDTO> parcelas;

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
    public BigDecimal getValorTotalDocumento() {
        return valorTotalDocumento;
    }
    public void setValorTotalDocumento(BigDecimal valorTotalDocumento) {
        this.valorTotalDocumento = valorTotalDocumento;
    }
    public String getFormaPagamento() {
        return formaPagamento;
    }
    public void setFormaPagamento(String formaPagamento) {
        this.formaPagamento = formaPagamento;
    }
    public List<ParcelaPagamentoDTO> getParcelas() {
        return parcelas;
    }
    public void setParcelas(List<ParcelaPagamentoDTO> parcelas) {
        this.parcelas = parcelas;
    }
}