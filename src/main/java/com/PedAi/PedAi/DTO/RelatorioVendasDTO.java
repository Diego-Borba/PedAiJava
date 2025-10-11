package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Venda;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class RelatorioVendasDTO {

    private Long id;
    private ZonedDateTime dataVenda;
    private String clienteNome;
    private BigDecimal total;
    private List<String> formasPagamento;
    private List<String> itens;

    public RelatorioVendasDTO(Venda venda) {
        this.id = venda.getId();
        this.dataVenda = venda.getDataVenda();
        this.clienteNome = venda.getCliente() != null ? venda.getCliente().getNome() : "N/A";
        this.total = venda.getTotal();
        this.formasPagamento = venda.getPagamentos().stream()
                .map(p -> p.getForma().replace("_", " "))
                .distinct()
                .collect(Collectors.toList());
        this.itens = venda.getItens().stream()
                .map(item -> item.getQuantidade() + "x " + item.getProduto().getNome())
                .collect(Collectors.toList());
    }

    // Getters
    public Long getId() { return id; }
    public ZonedDateTime getDataVenda() { return dataVenda; }
    public String getClienteNome() { return clienteNome; }
    public BigDecimal getTotal() { return total; }
    public List<String> getFormasPagamento() { return formasPagamento; }
    public List<String> getItens() { return itens; }
}