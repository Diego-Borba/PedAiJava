package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.ContaAReceber;
import com.PedAi.PedAi.Model.StatusContaAReceber;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ContaAReceberDTO {

    private Long id;
    private Long clienteId;
    private String clienteNome; // Agora usamos o campo direto da entidade
    private String origem;
    private BigDecimal valorTotal;
    private BigDecimal valorRecebido;
    private BigDecimal valorRestante;
    private StatusContaAReceber status;
    private LocalDate dataVencimento;

    public ContaAReceberDTO(ContaAReceber conta) {
        this.id = conta.getId();
        if (conta.getCliente() != null) {
            this.clienteId = conta.getCliente().getId();
        }
        this.clienteNome = conta.getClienteNome(); // ATUALIZADO
        this.origem = conta.getOrigem();
        this.valorTotal = conta.getValorTotal();
        this.valorRecebido = conta.getValorRecebido();
        this.valorRestante = conta.getValorTotal().subtract(conta.getValorRecebido());
        this.status = conta.getStatus();
        this.dataVencimento = conta.getDataVencimento();
    }

    // Getters
    public Long getId() { return id; }
    public Long getClienteId() { return clienteId; }
    public String getClienteNome() { return clienteNome; }
    public String getOrigem() { return origem; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public BigDecimal getValorRecebido() { return valorRecebido; }
    public BigDecimal getValorRestante() { return valorRestante; }
    public StatusContaAReceber getStatus() { return status; }
    public LocalDate getDataVencimento() { return dataVencimento; }
}