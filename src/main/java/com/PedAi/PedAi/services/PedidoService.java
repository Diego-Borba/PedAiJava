package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.ItemPedidoDTO;
import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.ItemReceita;
import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.PedidoRepository;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Transactional
    public Pedido criarPedido(List<ItemPedidoDTO> itensDTO) {
        if (itensDTO == null || itensDTO.isEmpty()) {
            throw new IllegalArgumentException("O pedido deve conter ao menos um item.");
        }

        Pedido pedido = new Pedido();
        pedido.setDataPedido(ZonedDateTime.now(ZoneOffset.UTC));
        pedido.setStatus("Recebido");

        List<ItemPedido> itensPedido = new ArrayList<>();
        for (ItemPedidoDTO itemDto : itensDTO) {
            Produto produtoVendido = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto com ID " + itemDto.getProdutoId() + " não encontrado"));

            // Lógica de baixa de estoque
            darBaixaEstoque(produtoVendido, itemDto.getQuantidade());

            ItemPedido item = new ItemPedido();
            item.setProduto(produtoVendido);
            item.setQuantidade(itemDto.getQuantidade());
            item.setPrecoUnitario(itemDto.getPrecoUnitario());
            item.setPedido(pedido);
            itensPedido.add(item);
        }

        pedido.setItens(itensPedido);
        return pedidoRepository.save(pedido);
    }

    private void darBaixaEstoque(Produto produtoVendido, int quantidadeVendida) {
        if (produtoVendido.getReceita() != null && !produtoVendido.getReceita().isEmpty()) {
            // Baixa de ingredientes para produtos compostos
            for (ItemReceita ingrediente : produtoVendido.getReceita()) {
                Produto produtoIngrediente = produtoRepository.findById(ingrediente.getProdutoIngredienteId())
                        .orElseThrow(() -> new RuntimeException("Ingrediente com ID " + ingrediente.getProdutoIngredienteId()
                                + " não encontrado na receita do produto " + produtoVendido.getNome()));

                BigDecimal quantidadeAbaixar = ingrediente.getQuantidadeUtilizada()
                        .multiply(new BigDecimal(quantidadeVendida));

                if (produtoIngrediente.getEstoqueAtual().compareTo(quantidadeAbaixar) < 0) {
                    throw new RuntimeException("Estoque insuficiente para o ingrediente: " + produtoIngrediente.getNome());
                }
                produtoIngrediente.setEstoqueAtual(produtoIngrediente.getEstoqueAtual().subtract(quantidadeAbaixar));
                produtoRepository.save(produtoIngrediente);
            }
        } else {
            // Baixa para produtos de venda direta
            BigDecimal quantidadeAbaixar = new BigDecimal(quantidadeVendida);
            if (produtoVendido.getEstoqueAtual().compareTo(quantidadeAbaixar) < 0) {
                throw new RuntimeException("Estoque insuficiente para o produto: " + produtoVendido.getNome());
            }
            produtoVendido.setEstoqueAtual(produtoVendido.getEstoqueAtual().subtract(quantidadeAbaixar));
            produtoRepository.save(produtoVendido);
        }
    }
}