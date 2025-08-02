package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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
    @Transactional
    public ResponseEntity<Produto> create(@RequestBody Produto produto) {
        try {
            if (produto.isKit() && produto.getGruposKit() != null) {
                produto.getGruposKit().forEach(grupo -> {
                    grupo.setProdutoKit(produto);
                    grupo.getOpcoes().forEach(opcao -> {
                        opcao.setGrupo(grupo);
                        if (opcao.getProduto() != null && opcao.getProduto().getId() != null) {
                            repository.findById(opcao.getProduto().getId()).ifPresent(opcao::setProduto);
                        }
                    });
                });
            }
            Produto savedProduto = repository.save(produto);
            return ResponseEntity.status(201).body(savedProduto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Produto> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        return repository.findById(id).map(produtoExistente -> {
            produtoExistente.setNome(produtoDetails.getNome());
            produtoExistente.setPreco(produtoDetails.getPreco());
            produtoExistente.setCategoria(produtoDetails.getCategoria());
            produtoExistente.setDescricao(produtoDetails.getDescricao());
            produtoExistente.setImagem(produtoDetails.getImagem());
            produtoExistente.setAtivo(produtoDetails.isAtivo());
            produtoExistente.setIsComplemento(produtoDetails.isComplemento());
            produtoExistente.setKit(produtoDetails.isKit());

            produtoExistente.getGruposKit().clear();
            if (produtoDetails.isKit() && produtoDetails.getGruposKit() != null) {
                produtoDetails.getGruposKit().forEach(grupoNovo -> {
                    grupoNovo.setProdutoKit(produtoExistente);
                    grupoNovo.getOpcoes().forEach(opcaoNova -> {
                        opcaoNova.setGrupo(grupoNovo);
                        if (opcaoNova.getProduto() != null && opcaoNova.getProduto().getId() != null) {
                            repository.findById(opcaoNova.getProduto().getId()).ifPresent(opcaoNova::setProduto);
                        }
                    });
                    produtoExistente.getGruposKit().add(grupoNovo);
                });
            }
            return ResponseEntity.ok(repository.save(produtoExistente));
        }).orElse(ResponseEntity.notFound().build());
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
        return repository.findAll().stream()
                .filter(p -> p.isAtivo() &&
                        ((!p.isMateriaPrima() && !p.isComplemento()) || // Produto comum
                         (p.isComplemento() && p.isAtivo())))           // Complemento vendido individualmente
                .toList();
    }
}
