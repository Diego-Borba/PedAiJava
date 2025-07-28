package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.ItemPedidoDTO;
import com.PedAi.PedAi.DTO.PedidoDTO;
import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.ItemReceita;
import com.PedAi.PedAi.Model.OpcaoComplemento;
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
import java.util.stream.Collectors;

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
     * Este método agora centraliza toda a lógica de criação e baixa de estoque.
     * @param pedidoDTO O objeto com todos os dados do pedido.
     * @return O pedido que foi salvo no banco de dados.
     */
    @Transactional
    public Pedido criarPedido(PedidoDTO pedidoDTO) {
        // 1. Validação e busca do Cliente
        Cliente cliente = clienteRepository.findById(pedidoDTO.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente com ID " + pedidoDTO.getClienteId() + " não encontrado."));

        if (pedidoDTO.getItens() == null || pedidoDTO.getItens().isEmpty()) {
            throw new IllegalArgumentException("O pedido deve conter ao menos um item.");
        }

        // 2. Criação do Pedido principal
        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setDataPedido(ZonedDateTime.now(ZoneOffset.UTC));
        pedido.setStatus("Recebido");
        pedido.setEnderecoEntrega(pedidoDTO.getEnderecoEntrega());
        // Se precisar da forma de pagamento, descomente a linha abaixo e adicione o campo no modelo Pedido.
        // pedido.setFormaPagamento(pedidoDTO.getFormaPagamento());

        List<ItemPedido> itensDePedidoProcessados = new ArrayList<>();

        // 3. Processamento dos Itens e Baixa de Estoque
        for (ItemPedidoDTO itemDto : pedidoDTO.getItens()) {
            Produto produtoVendido = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto com ID " + itemDto.getProdutoId() + " não encontrado"));

            // A baixa de estoque é chamada para cada item do DTO
            darBaixaEstoque(produtoVendido, itemDto.getQuantidade());

            // Adiciona o item ao pedido que será salvo
            ItemPedido item = new ItemPedido();
            item.setProduto(produtoVendido);
            item.setQuantidade(itemDto.getQuantidade());
            item.setPrecoUnitario(itemDto.getPrecoUnitario());
            item.setPedido(pedido);
            itensDePedidoProcessados.add(item);
        }

        pedido.setItens(itensDePedidoProcessados);
        
        // 4. Salva o Pedido e seus itens em uma única transação
        return pedidoRepository.save(pedido);
    }

    /**
     * Método auxiliar para dar baixa no estoque de um produto.
     * Ele verifica se o produto é composto (tem receita), se é um Kit (baixa os componentes),
     * ou se é um produto simples (baixa de seu próprio estoque).
     * @param produtoVendido O produto que está sendo vendido.
     * @param quantidadeVendida A quantidade que está sendo vendida.
     */
    private void darBaixaEstoque(Produto produto, int quantidadeVendida) {
        // Se o preço for zero, consideramos que é um "sub-item" de um kit cujo valor já está no item principal.
        // A baixa de estoque para ele deve ocorrer, mas ele não deve ser processado como um item-pai.
        boolean isSubItemDeKit = produto.getPreco() != null && produto.getPreco() == 0;

        if (isSubItemDeKit) {
             // Baixa de item simples (que é um componente de um kit)
            atualizarEstoqueProdutoSimples(produto, quantidadeVendida);

        } else if (produto.isKit()) {
            // Se for um Kit, não baixamos o estoque do "produto Kit" em si,
            // pois os itens que realmente saem do estoque são as *opções* dele,
            // que já foram enviadas no DTO e serão processadas individualmente.
            // A lógica no frontend já garante que as opções do kit sejam enviadas como itens separados.
            
        } else if (produto.getReceita() != null && !produto.getReceita().isEmpty()) {
            // Baixa de ingredientes para produtos compostos (receita)
            for (ItemReceita ingrediente : produto.getReceita()) {
                Produto produtoIngrediente = produtoRepository.findById(ingrediente.getProdutoIngredienteId())
                        .orElseThrow(() -> new RuntimeException("Ingrediente com ID " + ingrediente.getProdutoIngredienteId()
                                + " não encontrado na receita do produto " + produto.getNome()));

                BigDecimal quantidadeAbaixar = ingrediente.getQuantidadeUtilizada()
                        .multiply(new BigDecimal(quantidadeVendida));
                
                atualizarEstoqueProdutoSimples(produtoIngrediente, quantidadeAbaixar);
            }
        } else {
            // Baixa para produtos de venda direta (que não são kits nem têm receita)
             atualizarEstoqueProdutoSimples(produto, new BigDecimal(quantidadeVendida));
        }
    }

    /**
    * Atualiza o estoque de um produto final (matéria-prima ou produto de venda direta).
    */
    private void atualizarEstoqueProdutoSimples(Produto produto, BigDecimal quantidadeAbaixar) {
        if (produto.getEstoqueAtual().compareTo(quantidadeAbaixar) < 0) {
            throw new RuntimeException("Estoque insuficiente para o item: " + produto.getNome());
        }
        produto.setEstoqueAtual(produto.getEstoqueAtual().subtract(quantidadeAbaixar));
        // O JPA/Hibernate gerencia a atualização do produto no banco de dados ao final da transação.
    }
     private void atualizarEstoqueProdutoSimples(Produto produto, int quantidade) {
        atualizarEstoqueProdutoSimples(produto, new BigDecimal(quantidade));
    }
}