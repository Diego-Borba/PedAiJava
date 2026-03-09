package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.DTO.*;
import com.PedAi.PedAi.services.ProdutoService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoService produtoService;

    @GetMapping
    public ResponseEntity<List<ProdutoListDTO>> getAll() {
        return ResponseEntity.ok(produtoService.getAll());
    }

    @GetMapping("/cardapio")
    public ResponseEntity<List<ProdutoCardapioDTO>> getProdutosParaCardapio() {
        return ResponseEntity.ok(produtoService.getProdutosParaCardapio());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produto> getById(@PathVariable Long id) {
        Optional<Produto> produto = produtoService.getById(id);
        return produto.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Produto produto) {
        try {
            Produto savedProduto = produtoService.create(produto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao salvar produto: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/imagem")
    public ResponseEntity<?> uploadImagem(@PathVariable Long id, @RequestBody ImagemDTO imagemDTO) {
        try {
            produtoService.uploadImagem(id, imagemDTO);
            return ResponseEntity.ok().body(java.util.Map.of("message", "Imagem salva com sucesso."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) { 
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        try {
            Produto updatedProduto = produtoService.update(id, produtoDetails);
            return ResponseEntity.ok(updatedProduto);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            produtoService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> getCategorias() {
        return ResponseEntity.ok(produtoService.getCategorias());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProdutoSearchDTO>> searchProdutos(@RequestParam("q") String termo) {
        return ResponseEntity.ok(produtoService.searchProdutos(termo));
    }
}