package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.ItemPedidoDTO;
import com.PedAi.PedAi.DTO.PedidoDTO;
import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.ItemReceita;
import com.PedAi.PedAi.Model.OpcaoComplemento;
import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.Model.TipoPedido;
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
import java.util.stream.Collectors;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Transactional
    public Pedido criarPedido(PedidoDTO pedidoDTO) {
        // 1. Validação e busca do Cliente
        Cliente cliente = clienteRepository.findById(pedidoDTO.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Cliente com ID " + pedidoDTO.getClienteId() + " não encontrado."));

        if (pedidoDTO.getItens() == null || pedidoDTO.getItens().isEmpty()) {
            throw new IllegalArgumentException("O pedido deve conter ao menos um item.");
        }

        // 2. Criação do Pedido principal
        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setDataPedido(ZonedDateTime.now(ZoneOffset.UTC));
        pedido.setStatus("Recebido");

        // --- NOVOS CAMPOS SENDO SALVOS ---
        pedido.setEnderecoEntrega(pedidoDTO.getEnderecoEntrega());
        pedido.setFormaPagamento(pedidoDTO.getFormaPagamento());
        pedido.setTipo(pedidoDTO.getTipo() != null ? pedidoDTO.getTipo() : TipoPedido.ENTREGA); // Define um padrão
        if (pedido.getTipo() == TipoPedido.ENCOMENDA) {
            pedido.setDataAgendamento(pedidoDTO.getDataAgendamento());
        }
        // --- FIM DA ATUALIZAÇÃO ---

        List<ItemPedido> itensDePedidoProcessados = new ArrayList<>();

        // 3. Processamento dos Itens e Baixa de Estoque
        for (ItemPedidoDTO itemDto : pedidoDTO.getItens()) {
            Produto produtoVendido = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(
                            () -> new RuntimeException("Produto com ID " + itemDto.getProdutoId() + " não encontrado"));

            darBaixaEstoque(produtoVendido, itemDto.getQuantidade());

            ItemPedido item = new ItemPedido();
            item.setProduto(produtoVendido);
            item.setQuantidade(itemDto.getQuantidade());
            item.setPrecoUnitario(itemDto.getPrecoUnitario());
            item.setPedido(pedido);
            itensDePedidoProcessados.add(item);
        }

        pedido.setItens(itensDePedidoProcessados);

        return pedidoRepository.save(pedido);
    }

    private void darBaixaEstoque(Produto produto, int quantidadeVendida) {
        
        boolean isSubItemDeKit = produto.getPreco() != null && produto.getPreco() == 0;

        if (isSubItemDeKit) {
            atualizarEstoqueProdutoSimples(produto, quantidadeVendida);

        } else if (produto.isKit()) {

        } else if (produto.getReceita() != null && !produto.getReceita().isEmpty()) {
            for (ItemReceita ingrediente : produto.getReceita()) {
                Produto produtoIngrediente = produtoRepository.findById(ingrediente.getProdutoIngredienteId())
                        .orElseThrow(
                                () -> new RuntimeException("Ingrediente com ID " + ingrediente.getProdutoIngredienteId()
                                        + " não encontrado na receita do produto " + produto.getNome()));

                BigDecimal quantidadeAbaixar = ingrediente.getQuantidadeUtilizada()
                        .multiply(new BigDecimal(quantidadeVendida));

                atualizarEstoqueProdutoSimples(produtoIngrediente, quantidadeAbaixar);
            }
        } else {
            atualizarEstoqueProdutoSimples(produto, new BigDecimal(quantidadeVendida));
        }
    }
    private void atualizarEstoqueProdutoSimples(Produto produto, BigDecimal quantidadeAbaixar) {
        if (produto.getEstoqueAtual().compareTo(quantidadeAbaixar) < 0) {
            throw new RuntimeException("Estoque insuficiente para o item: " + produto.getNome());
        }
        produto.setEstoqueAtual(produto.getEstoqueAtual().subtract(quantidadeAbaixar));
    }

    private void atualizarEstoqueProdutoSimples(Produto produto, int quantidade) {
        atualizarEstoqueProdutoSimples(produto, new BigDecimal(quantidade));
    }
}