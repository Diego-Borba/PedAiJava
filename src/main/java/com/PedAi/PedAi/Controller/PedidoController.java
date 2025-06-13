package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.ItemReceita;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ClienteRepository;
import com.PedAi.PedAi.repository.PedidoRepository;
import com.PedAi.PedAi.repository.ProdutoRepository;
import com.PedAi.PedAi.services.PedidoService;
import com.PedAi.PedAi.DTO.PedidoDTO;
import com.PedAi.PedAi.DTO.StatusDTO;
import com.PedAi.PedAi.DTO.ItemPedidoDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;
    
    @Autowired
    private PedidoService pedidoService;

    // ALTERAÇÃO: Injeção do repositório de cliente que já estava no seu código.
    @Autowired
    private ClienteRepository clienteRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<?> criarPedido(@RequestBody PedidoDTO pedidoDTO) {
        
        // ALTERAÇÃO: Validação e busca do cliente pelo ID recebido no DTO.
        if (pedidoDTO.getClienteId() == null) {
            return ResponseEntity.badRequest().body("A identificação do cliente é obrigatória.");
        }
        Cliente cliente = clienteRepository.findById(pedidoDTO.getClienteId())
                .orElse(null); // Usamos orElse(null) para tratar o erro abaixo.

        if (cliente == null) {
            return ResponseEntity.badRequest().body("Cliente com ID " + pedidoDTO.getClienteId() + " não encontrado.");
        }
        // FIM DA ALTERAÇÃO

        if (pedidoDTO.getItens() == null || pedidoDTO.getItens().isEmpty()) {
            return ResponseEntity.badRequest().body("O pedido deve conter ao menos um item.");
        }

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente); // ALTERAÇÃO: Associa o pedido ao cliente encontrado.
        pedido.setDataPedido(ZonedDateTime.now(ZoneOffset.UTC));
        pedido.setStatus("Recebido");

        List<ItemPedido> itensPedido = new ArrayList<>();
        for (ItemPedidoDTO itemDto : pedidoDTO.getItens()) {
            Produto produtoVendido = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto com ID " + itemDto.getProdutoId() + " não encontrado"));
            
            // Sua lógica de baixa de estoque continua idêntica aqui...
            if (produtoVendido.getReceita() != null && !produtoVendido.getReceita().isEmpty()) {
                for (ItemReceita ingrediente : produtoVendido.getReceita()) {
                    Produto produtoIngrediente = produtoRepository.findById(ingrediente.getProdutoIngredienteId())
                            .orElseThrow(() -> new RuntimeException("Ingrediente não encontrado na receita"));
                    BigDecimal quantidadeAbaixar = ingrediente.getQuantidadeUtilizada().multiply(new BigDecimal(itemDto.getQuantidade()));
                    if (produtoIngrediente.getEstoqueAtual().compareTo(quantidadeAbaixar) < 0) {
                        throw new RuntimeException("Estoque insuficiente para o ingrediente: " + produtoIngrediente.getNome());
                    }
                    produtoIngrediente.setEstoqueAtual(produtoIngrediente.getEstoqueAtual().subtract(quantidadeAbaixar));
                }
            } else {
                BigDecimal quantidadeAbaixar = new BigDecimal(itemDto.getQuantidade());
                if (produtoVendido.getEstoqueAtual().compareTo(quantidadeAbaixar) < 0) {
                    throw new RuntimeException("Estoque insuficiente para o produto: " + produtoVendido.getNome());
                }
                produtoVendido.setEstoqueAtual(produtoVendido.getEstoqueAtual().subtract(quantidadeAbaixar));
            }

            ItemPedido item = new ItemPedido();
            item.setProduto(produtoVendido);
            item.setQuantidade(itemDto.getQuantidade());
            item.setPrecoUnitario(itemDto.getPrecoUnitario());
            item.setPedido(pedido);
            itensPedido.add(item);
        }

        pedido.setItens(itensPedido);
        pedidoRepository.save(pedido);

        return ResponseEntity.ok(Map.of("id", pedido.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPedido(@PathVariable Long id) {
        // Este método não precisa de alterações
        return pedidoRepository.findById(id).map(pedido -> {
            Map<String, Object> body = new HashMap<>();
            body.put("id", pedido.getId());
            body.put("dataPedido", pedido.getDataPedido());
            body.put("status", pedido.getStatus());
            // ... (resto do seu método getPedido)
            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ALTERAÇÃO: Nome do método alterado para maior clareza. Este é para o ADMIN.
    @GetMapping
    public ResponseEntity<?> listarTodosPedidos() {
        List<Pedido> pedidos = pedidoRepository.findAll(Sort.by(Sort.Direction.DESC, "dataPedido"));
        // A sua lógica de mapeamento para a resposta aqui está ótima e pode ser mantida.
        List<Map<String, Object>> resposta = pedidos.stream().map(p -> Map.of(
                "id", p.getId(),
                "dataPedido", p.getDataPedido(),
                "status", p.getStatus(),
                "itens", p.getItens().stream().map(i -> Map.of(
                        "produtoId", i.getProduto().getId(),
                        "produto", i.getProduto().getNome(),
                        "quantidade", i.getQuantidade(),
                        "precoUnitario", i.getPrecoUnitario())).toList()))
                .toList();
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/por-cliente/{clienteId}")
    public ResponseEntity<?> listarPedidosPorCliente(@PathVariable Long clienteId) {
        if (!clienteRepository.existsById(clienteId)) {
            return ResponseEntity.notFound().build();
        }

        // Busca os pedidos usando o novo método do repositório
        List<Pedido> pedidos = pedidoRepository.findByClienteIdOrderByDataPedidoDesc(clienteId);

        // Transforma os pedidos em um formato JSON amigável para a tela do cliente
        List<Map<String, Object>> resposta = pedidos.stream().map(p -> {
            Map<String, Object> pedidoMap = new HashMap<>();
            pedidoMap.put("id", p.getId());
            pedidoMap.put("dataPedido", p.getDataPedido());
            pedidoMap.put("status", p.getStatus());
            pedidoMap.put("total", p.getTotal()); // Inclui o total do pedido
            pedidoMap.put("itens", p.getItens().stream().map(i -> Map.of(
                "produtoNome", i.getProduto().getNome(),
                "quantidade", i.getQuantidade(),
                "subtotal", i.getSubtotal()
            )).collect(Collectors.toList()));
            return pedidoMap;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(resposta);
    }


    @PutMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id, @RequestBody StatusDTO dto) {
        return pedidoRepository.findById(id).map(pedido -> {
            if (dto.getNovoStatus() == null || dto.getNovoStatus().isBlank()) {
                return ResponseEntity.badRequest().body("O novo status é obrigatório.");
            }
            pedido.setStatus(dto.getNovoStatus());
            pedidoRepository.save(pedido);
            return ResponseEntity.ok(Map.of("id", pedido.getId(), "status", pedido.getStatus()));
        }).orElse(ResponseEntity.notFound().build());
    }
}