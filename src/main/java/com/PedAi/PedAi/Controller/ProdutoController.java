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
        // Ao buscar todos, os novos campos (isComplemento, permiteComplementos, complementosDisponiveis)
        // serão serializados e enviados para o frontend.
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
        // O objeto 'produto' recebido do frontend DEVE conter os novos campos
        // para que sejam persistidos corretamente.
        // Ex: produto.setComplementosDisponiveis(listaRecebida);
        try {
            Produto savedProduto = repository.save(produto);
            return ResponseEntity.status(201).body(savedProduto);
        } catch (Exception e) {
            // Logar o erro e retornar uma resposta mais informativa se possível
            System.err.println("Erro ao criar produto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> update(@PathVariable Long id, @RequestBody Produto produto) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        produto.setId(id); // Garante que o ID correto está sendo atualizado
        // Similar ao POST, o objeto 'produto' deve vir com os novos campos populados.
        try {
            Produto updatedProduto = repository.save(produto);
            return ResponseEntity.ok(updatedProduto);
        } catch (Exception e) {
            System.err.println("Erro ao atualizar produto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> getCategorias() {
        List<String> categorias = repository.findDistinctCategorias();
        return ResponseEntity.ok(categorias);
    }
}