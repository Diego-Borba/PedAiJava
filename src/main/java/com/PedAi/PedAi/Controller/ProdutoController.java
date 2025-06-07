package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
    public List<Produto> getAll() {
        // Ao buscar todos, os novos campos (isComplemento, permiteComplementos,
        // complementosDisponiveis)
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

    // Dentro da classe com.PedAi.PedAi.Controller.ProdutoController

    @PutMapping("/{id}")
    public ResponseEntity<Produto> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        Optional<Produto> produtoExistenteOptional = repository.findById(id);

        if (produtoExistenteOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Produto produtoExistente = produtoExistenteOptional.get();

        // Atualiza todos os campos do objeto existente com os novos detalhes
        produtoExistente.setNome(produtoDetails.getNome());
        produtoExistente.setPreco(produtoDetails.getPreco());
        produtoExistente.setCategoria(produtoDetails.getCategoria());
        produtoExistente.setQtdeMax(produtoDetails.getQtdeMax());
        produtoExistente.setDescricao(produtoDetails.getDescricao());
        produtoExistente.setImagem(produtoDetails.getImagem());
        produtoExistente.setCodPdv(produtoDetails.getCodPdv());
        produtoExistente.setOrdemVisualizacao(produtoDetails.getOrdemVisualizacao());
        produtoExistente.setAtivo(produtoDetails.isAtivo());
        produtoExistente.setMateriaPrima(produtoDetails.isMateriaPrima());
        produtoExistente.setIsComplemento(produtoDetails.isComplemento());
        produtoExistente.setPermiteComplementos(produtoDetails.isPermiteComplementos());

        // Atualiza a lista de complementos disponíveis
        if (produtoDetails.getComplementosDisponiveis() != null) {
            produtoExistente.getComplementosDisponiveis().clear();
            produtoExistente.getComplementosDisponiveis().addAll(produtoDetails.getComplementosDisponiveis());
        }

        // ================== CORREÇÃO AQUI ==================
        // Atualiza a lista de receita
        if (produtoDetails.getReceita() != null) {
            // Limpa a receita antiga
            produtoExistente.getReceita().clear();
            // Adiciona os novos ingredientes da receita
            produtoExistente.getReceita().addAll(produtoDetails.getReceita());
        }
        // ===================================================

        // Aplica a lógica de negócio para garantir a consistência dos dados
        if (produtoExistente.isMateriaPrima() || produtoExistente.isComplemento()) {
            produtoExistente.getReceita().clear();
            produtoExistente.setPermiteComplementos(false);
        }
        if (produtoExistente.isComplemento()) {
            produtoExistente.setMateriaPrima(false);
        }

        // Salva o produto atualizado no banco
        final Produto updatedProduto = repository.save(produtoExistente);
        return ResponseEntity.ok(updatedProduto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id))
            return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> getCategorias() {
        List<String> categorias = repository.findDistinctCategorias();
        return ResponseEntity.ok(categorias);
    }

    @GetMapping("/cardapio")
    public List<Produto> getProdutosParaCardapio() {
        // Retorna todos os produtos que NÃO são matéria-prima E NÃO são complementos
        return repository.findAll().stream()
                .filter(p -> !p.isMateriaPrima() && !p.isComplemento() && p.isAtivo())
                .toList();
    }
}