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

    // Dentro da classe com.PedAi.PedAi.Controller.ProdutoController

    @PutMapping("/{id}")
    public ResponseEntity<Produto> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        Optional<Produto> produtoExistenteOptional = repository.findById(id);

        // 2. Se o produto não for encontrado, retorna o erro 404 (Not Found)
        if (produtoExistenteOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // 3. Se encontrou, pega o objeto para ser atualizado
        Produto produtoExistente = produtoExistenteOptional.get();

        // 4. Atualiza todos os campos do objeto existente com os novos detalhes
        produtoExistente.setNome(produtoDetails.getNome());
        produtoExistente.setPreco(produtoDetails.getPreco());
        produtoExistente.setCategoria(produtoDetails.getCategoria());
        produtoExistente.setQtdeMax(produtoDetails.getQtdeMax());
        produtoExistente.setDescricao(produtoDetails.getDescricao());
        produtoExistente.setImagem(produtoDetails.getImagem());
        produtoExistente.setCodPdv(produtoDetails.getCodPdv());
        produtoExistente.setOrdemVisualizacao(produtoDetails.getOrdemVisualizacao());
        produtoExistente.setAtivo(produtoDetails.isAtivo());
        produtoExistente.setIsComplemento(produtoDetails.isComplemento());
        produtoExistente.setPermiteComplementos(produtoDetails.isPermiteComplementos());

        // 5. Aplica a lógica de negócio para garantir a consistência dos dados
        if (produtoExistente.isComplemento()) {
            produtoExistente.setPermiteComplementos(false);
            if (produtoExistente.getComplementosDisponiveis() != null) {
                produtoExistente.getComplementosDisponiveis().clear();
            }
        } else {
            if (produtoDetails.getComplementosDisponiveis() != null) {
                produtoExistente.getComplementosDisponiveis().clear();
                produtoExistente.getComplementosDisponiveis().addAll(produtoDetails.getComplementosDisponiveis());
            }
        }

        // 6. Salva o produto atualizado no banco e retorna como resposta de sucesso
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
}