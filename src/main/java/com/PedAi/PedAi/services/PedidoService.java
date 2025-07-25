package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.ItemPedidoDTO;
import com.PedAi.PedAi.DTO.PedidoDTO;
import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.ItemReceita;
import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ClienteRepository;
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

    @Autowired
    private ClienteRepository clienteRepository;

    /**
     * Cria um pedido completo a partir do fluxo do carrinho de compras.
     * Este método espera um cliente identificado, endereço e forma de pagamento.
     * @param pedidoDTO O objeto com todos os dados do pedido.
     * @return O pedido que foi salvo no banco de dados.
     */
    @Transactional
    public Pedido criarPedido(PedidoDTO pedidoDTO) {

        if (pedidoDTO.getClienteId() == null) {
            throw new IllegalArgumentException("A identificação do cliente é obrigatória.");
        }
        Cliente cliente = clienteRepository.findById(pedidoDTO.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente com ID " + pedidoDTO.getClienteId() + " não encontrado."));

        if (pedidoDTO.getItens() == null || pedidoDTO.getItens().isEmpty()) {
            throw new IllegalArgumentException("O pedido deve conter ao menos um item.");
        }

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setDataPedido(ZonedDateTime.now(ZoneOffset.UTC));
        pedido.setStatus("Recebido");
        
        // Atribui o endereço de entrega e a forma de pagamento do DTO
        pedido.setEnderecoEntrega(pedidoDTO.getEnderecoEntrega());
        // A forma de pagamento foi removida do modelo Pedido. Se precisar, adicione o campo novamente.
        // pedido.setFormaPagamento(pedidoDTO.getFormaPagamento());

        List<ItemPedido> itensPedido = new ArrayList<>();
        for (ItemPedidoDTO itemDto : pedidoDTO.getItens()) {
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

    /**
     * Cria um pedido simplificado, geralmente vindo de fontes como o Webhook do Dialogflow.
     * @param itensDTO A lista de itens do pedido.
     * @return O pedido que foi salvo.
     */
    @Transactional
    public Pedido criarPedido(List<ItemPedidoDTO> itensDTO) {
        if (itensDTO == null || itensDTO.isEmpty()) {
            throw new IllegalArgumentException("O pedido via webhook deve conter ao menos um item.");
        }

        Pedido pedido = new Pedido();
        pedido.setCliente(null); // Pedidos de webhook podem não ter cliente associado
        pedido.setDataPedido(ZonedDateTime.now(ZoneOffset.UTC));
        pedido.setStatus("Recebido");
        pedido.setEnderecoEntrega(null);

        List<ItemPedido> itensPedido = new ArrayList<>();
        for (ItemPedidoDTO itemDto : itensDTO) {
            Produto produtoVendido = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto com ID " + itemDto.getProdutoId() + " não encontrado"));
            
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


    /**
     * Método auxiliar para dar baixa no estoque de um produto.
     * Ele verifica se o produto é composto (tem receita) e baixa os ingredientes,
     * ou se é um produto simples e baixa de seu próprio estoque.
     * @param produtoVendido O produto que está sendo vendido.
     * @param quantidadeVendida A quantidade que está sendo vendida.
     */
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
            }
        } else {
            // Baixa para produtos de venda direta
            BigDecimal quantidadeAbaixar = new BigDecimal(quantidadeVendida);
            if (produtoVendido.getEstoqueAtual().compareTo(quantidadeAbaixar) < 0) {
                throw new RuntimeException("Estoque insuficiente para o produto: " + produtoVendido.getNome());
            }
            produtoVendido.setEstoqueAtual(produtoVendido.getEstoqueAtual().subtract(quantidadeAbaixar));
        }
    }
}