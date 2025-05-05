package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Fornecedor;
import com.PedAi.PedAi.repository.FornecedorRepository;

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

    // (Opcional) Get todos os fornecedores
    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(fornecedorRepository.findAll());
    }
}
