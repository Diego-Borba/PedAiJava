package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.ContaAPagarDTO;
import com.PedAi.PedAi.DTO.ContaAPagarInputDTO;
import com.PedAi.PedAi.DTO.PagamentoDTO;
import com.PedAi.PedAi.Model.ContaAPagar;
import com.PedAi.PedAi.repository.ContaAPagarRepository;
import com.PedAi.PedAi.services.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contas-a-pagar")
public class ContaAPagarController {

    @Autowired private ContaAPagarRepository repository;
    @Autowired private FinanceiroService financeiroService;

    @GetMapping
    public List<ContaAPagarDTO> listarContas() {
        return repository.findAll().stream()
                .map(ContaAPagarDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContaAPagarDTO> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(conta -> ResponseEntity.ok(new ContaAPagarDTO(conta)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ContaAPagarDTO> criarConta(@RequestBody ContaAPagarInputDTO dto) {
        ContaAPagar novaConta = financeiroService.criarOuAtualizarContaAPagar(null, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ContaAPagarDTO(novaConta));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContaAPagarDTO> atualizarConta(@PathVariable Long id, @RequestBody ContaAPagarInputDTO dto) {
        try {
            ContaAPagar contaAtualizada = financeiroService.criarOuAtualizarContaAPagar(id, dto);
            return ResponseEntity.ok(new ContaAPagarDTO(contaAtualizada));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarConta(@PathVariable Long id) {
        try {
            financeiroService.deletarContaAPagar(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/registrar-pagamento")
    public ResponseEntity<ContaAPagarDTO> registrarPagamento(@PathVariable Long id, @RequestBody PagamentoDTO pagamentoDTO) {
        try {
            ContaAPagar contaAtualizada = financeiroService.registrarPagamentoAPagar(id, pagamentoDTO.getValor(), pagamentoDTO.getDataPagamento());
            return ResponseEntity.ok(new ContaAPagarDTO(contaAtualizada));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}