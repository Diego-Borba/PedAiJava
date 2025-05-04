package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
    public List<Produto> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produto> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Produto> create(@RequestBody Produto produto) {
        try {
            Produto savedProduto = repository.save(produto);
            return ResponseEntity.status(201).body(savedProduto);  // Retorna o produto salvo com status 201
        } catch (Exception e) {
            return ResponseEntity.status(500).build();  // Caso ocorra algum erro, retorna status 500
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> update(@PathVariable Long id, @RequestBody Produto produto) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        produto.setId(id);
        return ResponseEntity.ok(repository.save(produto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
