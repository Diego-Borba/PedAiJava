package com.PedAi.PedAi.DTO;

import com.PedAi.PedAi.Model.Venda; // Importe a entidade Venda

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class VendaDTO {

    private Long id; // Adicione o campo ID
    private Long clienteId;
    private String clienteNome; // Adicione o nome do cliente
    private ZonedDateTime dataVenda; // Adicione a data da venda
    private List<ItemVendaDTO> itens;
    private List<PagamentoDTO> pagamentos;
    private BigDecimal subtotal;
    private BigDecimal desconto;
    private BigDecimal acrescimo;
    private BigDecimal total;

    public VendaDTO() {
    } // Construtor padrão

    // --- NOVO CONSTRUTOR ADICIONADO ---
    public VendaDTO(Venda venda) {
        this.id = venda.getId();
        this.clienteId = venda.getCliente().getId();
        this.clienteNome = venda.getCliente().getNome();
        this.dataVenda = venda.getDataVenda();
        this.subtotal = venda.getSubtotal();
        this.desconto = venda.getDesconto();
        this.acrescimo = venda.getAcrescimo();
        this.total = venda.getTotal();
        this.itens = venda.getItens().stream().map(item -> {
            ItemVendaDTO dto = new ItemVendaDTO();
            dto.setId(item.getProduto().getId());
            dto.setNome(item.getProduto().getNome());
            dto.setQuantidade(item.getQuantidade());
            dto.setPrecoUnitario(item.getPrecoUnitario());
            return dto;
        }).collect(Collectors.toList());
        this.pagamentos = venda.getPagamentos().stream().map(pagamento -> {
            PagamentoDTO dto = new PagamentoDTO();
            dto.setForma(pagamento.getForma());
            dto.setValor(pagamento.getValor());
            return dto;
        }).collect(Collectors.toList());
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getClienteNome() {
        return clienteNome;
    }

    public void setClienteNome(String clienteNome) {
        this.clienteNome = clienteNome;
    }

    public ZonedDateTime getDataVenda() {
        return dataVenda;
    }

    public void setDataVenda(ZonedDateTime dataVenda) {
        this.dataVenda = dataVenda;
    }

    public List<ItemVendaDTO> getItens() {
        return itens;
    }

    public void setItens(List<ItemVendaDTO> itens) {
        this.itens = itens;
    }

    public List<PagamentoDTO> getPagamentos() {
        return pagamentos;
    }

    public void setPagamentos(List<PagamentoDTO> pagamentos) {
        this.pagamentos = pagamentos;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDesconto() {
        return desconto;
    }

    public void setDesconto(BigDecimal desconto) {
        this.desconto = desconto;
    }

    public BigDecimal getAcrescimo() {
        return acrescimo;
    }

    public void setAcrescimo(BigDecimal acrescimo) {
        this.acrescimo = acrescimo;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}