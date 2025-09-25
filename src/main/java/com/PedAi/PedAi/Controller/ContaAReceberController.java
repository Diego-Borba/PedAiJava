package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.ContaAReceberDTO;
import com.PedAi.PedAi.DTO.ContaAReceberInputDTO;
import com.PedAi.PedAi.DTO.PagamentoDTO;
import com.PedAi.PedAi.Model.ContaAReceber;
import com.PedAi.PedAi.repository.ContaAReceberRepository;
import com.PedAi.PedAi.services.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contas-a-receber")
public class ContaAReceberController {

    @Autowired private ContaAReceberRepository repository;
    @Autowired private FinanceiroService financeiroService;

    @GetMapping
    public List<ContaAReceberDTO> listarContas() {
        return repository.findAll().stream()
                .map(ContaAReceberDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContaAReceberDTO> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(conta -> ResponseEntity.ok(new ContaAReceberDTO(conta)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<ContaAReceberDTO> criarConta(@RequestBody ContaAReceberInputDTO dto) {
        ContaAReceber novaConta = financeiroService.criarOuAtualizarContaAReceber(null, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ContaAReceberDTO(novaConta));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContaAReceberDTO> atualizarConta(@PathVariable Long id, @RequestBody ContaAReceberInputDTO dto) {
        try {
            ContaAReceber contaAtualizada = financeiroService.criarOuAtualizarContaAReceber(id, dto);
            return ResponseEntity.ok(new ContaAReceberDTO(contaAtualizada));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarConta(@PathVariable Long id) {
        try {
            financeiroService.deletarContaAReceber(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/registrar-pagamento")
    public ResponseEntity<ContaAReceberDTO> registrarPagamento(@PathVariable Long id, @RequestBody PagamentoDTO pagamentoDTO) {
        try {
            ContaAReceber contaAtualizada = financeiroService.registrarPagamentoAReceber(id, pagamentoDTO.getValor(), pagamentoDTO.getDataPagamento());
            return ResponseEntity.ok(new ContaAReceberDTO(contaAtualizada));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}