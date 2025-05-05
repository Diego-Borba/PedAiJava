package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.PedidoRepository;
import com.PedAi.PedAi.repository.ProdutoRepository;
import com.PedAi.PedAi.DTO.PedidoDTO;
import com.PedAi.PedAi.DTO.StatusDTO;
import com.PedAi.PedAi.DTO.ItemPedidoDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Sort;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @PostMapping
    public ResponseEntity<?> criarPedido(@RequestBody PedidoDTO pedidoDTO) {
        if (pedidoDTO.getItens() == null || pedidoDTO.getItens().isEmpty()) {
            return ResponseEntity.badRequest().body("O pedido deve conter ao menos um item.");
        }

        Pedido pedido = new Pedido();
        pedido.setDataPedido(ZonedDateTime.now(ZoneOffset.UTC));
        pedido.setStatus("Recebido");

        List<ItemPedido> itens = new ArrayList<>();
        for (ItemPedidoDTO dto : pedidoDTO.getItens()) {
            Produto produto = produtoRepository.findById(dto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

            ItemPedido item = new ItemPedido();
            item.setProduto(produto);
            item.setQuantidade(dto.getQuantidade());
            item.setPrecoUnitario(dto.getPrecoUnitario());
            item.setPedido(pedido);

            itens.add(item);
        }

        pedido.setItens(itens);
        pedidoRepository.save(pedido);

        return ResponseEntity.ok(Map.of("id", pedido.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPedido(@PathVariable Long id) {
        Optional<Pedido> optPedido = pedidoRepository.findById(id);
        if (optPedido.isEmpty())
            return ResponseEntity.notFound().build();

        Pedido pedido = optPedido.get();
        
        List<Map<String, Object>> itens = new ArrayList<>();
        for (ItemPedido item : pedido.getItens()) {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("produtoId", item.getProduto().getId());
            itemMap.put("produto", item.getProduto().getNome());
            itemMap.put("quantidade", item.getQuantidade());
            itemMap.put("precoUnitario", item.getPrecoUnitario());
            itens.add(itemMap);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("id", pedido.getId());
        body.put("dataPedido", pedido.getDataPedido());
        body.put("status", pedido.getStatus());
        body.put("itens", itens);

        return ResponseEntity.ok(body);
    }

    @GetMapping
    public ResponseEntity<?> listarPedidos() {
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

    @PutMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id, @RequestBody StatusDTO dto) {
        Optional<Pedido> optPedido = pedidoRepository.findById(id);
        if (optPedido.isEmpty())
            return ResponseEntity.notFound().build();

        if (dto.getNovoStatus() == null || dto.getNovoStatus().isBlank()) {
            return ResponseEntity.badRequest().body("O novo status é obrigatório.");
        }

        Pedido pedido = optPedido.get();
        pedido.setStatus(dto.getNovoStatus());
        pedidoRepository.save(pedido);

        return ResponseEntity.ok(Map.of("id", pedido.getId(), "status", pedido.getStatus()));
    }
}
