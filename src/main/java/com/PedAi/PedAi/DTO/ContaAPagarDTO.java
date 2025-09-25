package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.ContaAPagar;
import com.PedAi.PedAi.Model.StatusContaAPagar;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ContaAPagarDTO {
    private Long id;
    private Long fornecedorId;
    private String fornecedorNome;
    private String descricao;
    private BigDecimal valorTotal;
    private BigDecimal valorPago;
    private BigDecimal valorRestante;
    private StatusContaAPagar status;
    private LocalDate dataVencimento;

    public ContaAPagarDTO(ContaAPagar conta) {
        this.id = conta.getId();
        if (conta.getFornecedor() != null) {
            this.fornecedorId = conta.getFornecedor().getId();
            this.fornecedorNome = conta.getFornecedor().getNome();
        }
        this.descricao = conta.getDescricao();
        this.valorTotal = conta.getValorTotal();
        this.valorPago = conta.getValorPago();
        this.valorRestante = conta.getValorTotal().subtract(conta.getValorPago());
        this.status = conta.getStatus();
        this.dataVencimento = conta.getDataVencimento();
    }
    
    // Getters
    public Long getId() { return id; }
    public Long getFornecedorId() { return fornecedorId; }
    public String getFornecedorNome() { return fornecedorNome; }
    public String getDescricao() { return descricao; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public BigDecimal getValorPago() { return valorPago; }
    public BigDecimal getValorRestante() { return valorRestante; }
    public StatusContaAPagar getStatus() { return status; }
    public LocalDate getDataVencimento() { return dataVencimento; }
}