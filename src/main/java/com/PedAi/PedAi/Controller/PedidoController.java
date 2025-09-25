package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.repository.ClienteRepository;
import com.PedAi.PedAi.repository.PedidoRepository;
import com.PedAi.PedAi.services.FinanceiroService;
import com.PedAi.PedAi.services.PedidoService;
import com.PedAi.PedAi.DTO.PedidoDTO;
import com.PedAi.PedAi.DTO.StatusDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Sort;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private FinanceiroService financeiroService;

    @PostMapping
    public ResponseEntity<?> criarPedido(@RequestBody PedidoDTO pedidoDTO) {
        try {
            Pedido novoPedido = pedidoService.criarPedido(pedidoDTO);
            return ResponseEntity.ok(Map.of("id", novoPedido.getId()));
        
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPedido(@PathVariable Long id) {
        return pedidoRepository.findById(id).map(pedido -> {
            Map<String, Object> body = new HashMap<>();
            body.put("id", pedido.getId());
            body.put("dataPedido", pedido.getDataPedido());
            body.put("status", pedido.getStatus());
            body.put("itens", pedido.getItens().stream().map(i -> Map.of(
                    "produtoId", i.getProduto().getId(),
                    "produto", i.getProduto().getNome(),
                    "quantidade", i.getQuantidade(),
                    "precoUnitario", i.getPrecoUnitario()
            )).collect(Collectors.toList()));
            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<?> listarTodosPedidos() {
        List<Pedido> pedidos = pedidoRepository.findAll(Sort.by(Sort.Direction.DESC, "dataPedido"));
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

        List<Pedido> pedidos = pedidoRepository.findByClienteIdOrderByDataPedidoDesc(clienteId);

        List<Map<String, Object>> resposta = pedidos.stream().map(p -> {
            Map<String, Object> pedidoMap = new HashMap<>();
            pedidoMap.put("id", p.getId());
            pedidoMap.put("dataPedido", p.getDataPedido());
            pedidoMap.put("status", p.getStatus());
            pedidoMap.put("total", p.getTotal());
            pedidoMap.put("itens", p.getItens().stream()
                .filter(i -> i.getPrecoUnitario().doubleValue() > 0)
                .map(i -> Map.of(
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
            
            String novoStatus = dto.getNovoStatus();
            pedido.setStatus(novoStatus);
            Pedido pedidoSalvo = pedidoRepository.save(pedido);

            if ("Entregue".equalsIgnoreCase(novoStatus)) {
                financeiroService.criarContaAReceberDePedido(pedidoSalvo);
            }

            return ResponseEntity.ok(Map.of("id", pedidoSalvo.getId(), "status", pedidoSalvo.getStatus()));
        }).orElse(ResponseEntity.notFound().build());
    }
}