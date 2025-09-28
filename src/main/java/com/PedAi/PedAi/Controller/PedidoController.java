package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.PedidoAdminDTO;
import com.PedAi.PedAi.DTO.PedidoDTO;
import com.PedAi.PedAi.DTO.StatusDTO;
import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.TipoPedido;
import com.PedAi.PedAi.repository.ClienteRepository;
import com.PedAi.PedAi.repository.PedidoRepository;
import com.PedAi.PedAi.repository.PedidoSpecification;
import com.PedAi.PedAi.services.FinanceiroService;
import com.PedAi.PedAi.services.PdfService;
import com.PedAi.PedAi.services.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
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

    @Autowired
    private PdfService pdfService;

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
                    "precoUnitario", i.getPrecoUnitario())).collect(Collectors.toList()));
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
                            "subtotal", i.getSubtotal()))
                    .collect(Collectors.toList()));
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

            // COMENTADO PARA EVITAR CRIAÇÃO AUTOMÁTICA DE CONTAS A RECEBER
            /*
             * if ("Entregue".equalsIgnoreCase(novoStatus)) {
             * financeiroService.criarContaAReceberDePedido(pedidoSalvo);
             * }
             */

            return ResponseEntity.ok(Map.of("id", pedidoSalvo.getId(), "status", pedidoSalvo.getStatus()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/por-tipo")
    public ResponseEntity<List<PedidoAdminDTO>> listarPorTipo(
            @RequestParam("tipo") TipoPedido tipo,
            @RequestParam(value = "cliente", required = false) String cliente,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "dataInicial", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime dataInicial,
            @RequestParam(value = "dataFinal", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime dataFinal) {

        Specification<Pedido> spec = PedidoSpecification.comFiltros(tipo, cliente, status, dataInicial, dataFinal);
        List<Pedido> pedidos = pedidoRepository.findAll(spec);

        List<PedidoAdminDTO> resposta = pedidos.stream()
                .map(PedidoAdminDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> gerarPdfPedido(@PathVariable Long id) {
        try {
            Pedido pedido = pedidoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

            byte[] pdfBytes = pdfService.gerarPdfPedido(pedido);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "inline; filename=pedido_" + id + ".pdf")
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}