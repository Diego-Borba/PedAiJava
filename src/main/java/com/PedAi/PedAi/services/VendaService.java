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
    // @Autowired
    // private PedidoService pedidoService; // Lógica de estoque a ser revisada

    @Transactional
    public Venda registrarVenda(VendaDTO vendaDTO) {
        Venda novaVenda = new Venda();
        novaVenda.setDataVenda(ZonedDateTime.now());

        // --- CORREÇÃO APLICADA AQUI ---
        Cliente cliente;
        if (vendaDTO.getClienteId() != null && vendaDTO.getClienteId() != 1L) {
            // Se um cliente específico foi informado (e não é o ID padrão antigo), busca por ele
            cliente = clienteRepository.findById(vendaDTO.getClienteId())
                    .orElseThrow(() -> new IllegalStateException("Cliente com ID " + vendaDTO.getClienteId() + " não encontrado."));
        } else {
            // Caso contrário, busca o cliente padrão pelo seu e-mail único e confiável
            cliente = clienteRepository.findByEmail("consumidor@final.com")
                    .orElseThrow(() -> new IllegalStateException("Cliente padrão 'Consumidor Final' não encontrado. Execute o DataInitializer."));
        }
        novaVenda.setCliente(cliente);
        // --- FIM DA CORREÇÃO ---

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

            // TODO: Implementar baixa de estoque aqui se necessário
            // Ex: produto.setEstoqueAtual(produto.getEstoqueAtual().subtract(new BigDecimal(itemDTO.getQuantidade())));
            // produtoRepository.save(produto);
        }
        novaVenda.setItens(itensVenda);

        List<PagamentoVenda> pagamentosVenda = new ArrayList<>();
        vendaDTO.getPagamentos().forEach(pagamentoDTO -> {
            PagamentoVenda pagamentoVenda = new PagamentoVenda();
            pagamentoVenda.setForma(pagamentoDTO.getForma());
            pagamentoVenda.setValor(pagamentoDTO.getValor());
            pagamentoVenda.setVenda(novaVenda);
            pagamentosVenda.add(pagamentoVenda);
        });
        novaVenda.setPagamentos(pagamentosVenda);

        return vendaRepository.save(novaVenda);
    }
}