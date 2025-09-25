package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.FornecedorSearchDTO;
import com.PedAi.PedAi.Model.Fornecedor;
import com.PedAi.PedAi.repository.FornecedorRepository;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fornecedores")
public class FornecedorController {

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @PostMapping
    public ResponseEntity<?> criarFornecedor(@RequestBody Fornecedor fornecedor) {
        if (fornecedor.getNome() == null || fornecedor.getNome().isBlank()) {
            return ResponseEntity.badRequest().body("Nome do fornecedor é obrigatório.");
        }

        fornecedorRepository.save(fornecedor);
        return ResponseEntity.ok("Fornecedor cadastrado com sucesso.");
    }

    
    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(fornecedorRepository.findAll());
    }

    @GetMapping("/search")
    public List<FornecedorSearchDTO> searchFornecedores(@RequestParam(value = "q", required = false, defaultValue = "") String query) {
        List<Fornecedor> fornecedores = fornecedorRepository.findByNomeContainingIgnoreCase(query);
        return fornecedores.stream()
                           .map(FornecedorSearchDTO::new)
                           .collect(Collectors.toList());
    }
}
