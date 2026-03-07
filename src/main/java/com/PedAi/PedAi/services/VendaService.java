package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.ItemVendaDTO;
import com.PedAi.PedAi.DTO.VendaDTO;
import com.PedAi.PedAi.Model.*;
import com.PedAi.PedAi.repository.ClienteRepository;
import com.PedAi.PedAi.repository.ProdutoRepository;
import com.PedAi.PedAi.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class VendaService {

    @Autowired
    private VendaRepository vendaRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private ProdutoRepository produtoRepository;
    @Autowired
    private FinanceiroService financeiroService;

    @Transactional
    public Venda registrarVenda(VendaDTO vendaDTO) {
        Venda novaVenda = new Venda();
        novaVenda.setDataVenda(ZonedDateTime.now());

        Cliente cliente;
        if (vendaDTO.getClienteId() != null) {
            cliente = clienteRepository.findById(vendaDTO.getClienteId())
                    .orElseThrow(() -> new IllegalStateException("Cliente com ID " + vendaDTO.getClienteId() + " não encontrado."));
        } else {
            cliente = clienteRepository.findByEmail("consumidor@final.com")
                    .orElseThrow(() -> new IllegalStateException("Cliente padrão 'Consumidor Final' não encontrado."));
        }
        novaVenda.setCliente(cliente);

        boolean temPagamentoAPrazo = vendaDTO.getPagamentos().stream()
                .anyMatch(p -> "A_Prazo".equals(p.getForma()));

        if (temPagamentoAPrazo) {
            if ("consumidor@final.com".equals(cliente.getEmail())) {
                throw new IllegalArgumentException("Para vendas 'A Prazo', é obrigatório selecionar um cliente cadastrado (não pode ser Consumidor Final).");
            }
        }

        novaVenda.setSubtotal(vendaDTO.getSubtotal());
        novaVenda.setDesconto(vendaDTO.getDesconto());
        novaVenda.setAcrescimo(vendaDTO.getAcrescimo());
        novaVenda.setTotal(vendaDTO.getTotal());

        List<ItemVenda> itensVenda = new ArrayList<>();
        for (ItemVendaDTO itemDTO : vendaDTO.getItens()) {
            Produto produto = produtoRepository.findById(itemDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Produto com ID " + itemDTO.getId() + " não encontrado."));
            
            ItemVenda itemVenda = new ItemVenda();
            itemVenda.setProduto(produto);
            itemVenda.setQuantidade(itemDTO.getQuantidade());
            itemVenda.setPrecoUnitario(produto.getPreco() != null ? new java.math.BigDecimal(produto.getPreco()) : java.math.BigDecimal.ZERO);
            itemVenda.setVenda(novaVenda);
            itensVenda.add(itemVenda);

            
             if (produto.getEstoqueAtual() != null) {
                 produto.setEstoqueAtual(produto.getEstoqueAtual().subtract(new java.math.BigDecimal(itemDTO.getQuantidade())));
                 produtoRepository.save(produto);
             }
        }
        novaVenda.setItens(itensVenda);

        List<PagamentoVenda> pagamentosVenda = new ArrayList<>();
        
        Venda vendaSalva = vendaRepository.save(novaVenda);

        vendaDTO.getPagamentos().forEach(pagamentoDTO -> {
            PagamentoVenda pagamentoVenda = new PagamentoVenda();
            pagamentoVenda.setForma(pagamentoDTO.getForma());
            pagamentoVenda.setValor(pagamentoDTO.getValor());
            pagamentoVenda.setVenda(vendaSalva);
            pagamentosVenda.add(pagamentoVenda);

            if ("A_Prazo".equals(pagamentoDTO.getForma())) {
                financeiroService.criarContaAReceberDeVenda(
                    vendaSalva, 
                    pagamentoDTO.getValor(), 
                    LocalDate.now().plusDays(30)
                );
            }
        });
        
        vendaSalva.setPagamentos(pagamentosVenda);
        
        return vendaRepository.save(vendaSalva);
    }
}