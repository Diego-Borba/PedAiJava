package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.RelatorioVendasDTO;
import com.PedAi.PedAi.Model.Venda;
import com.PedAi.PedAi.repository.VendaRepository;
import com.PedAi.PedAi.repository.VendaSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    @Autowired
    private VendaRepository vendaRepository;

    @GetMapping("/vendas")
    public ResponseEntity<List<RelatorioVendasDTO>> getRelatorioVendas(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long produtoId,
            @RequestParam(required = false) String formaPagamento,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime dataInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime dataFinal
    ) {
        Specification<Venda> spec = VendaSpecification.comFiltros(clienteId, produtoId, formaPagamento, dataInicial, dataFinal);
        List<Venda> vendas = vendaRepository.findAll(spec);
        List<RelatorioVendasDTO> dtos = vendas.stream().map(RelatorioVendasDTO::new).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}