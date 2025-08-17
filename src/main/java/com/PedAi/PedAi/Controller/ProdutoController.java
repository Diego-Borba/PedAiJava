// Caminho: src/main/java/com/PedAi/PedAi/Controller/ProdutoController.java
package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.DTO.ProdutoListDTO;
import com.PedAi.PedAi.DTO.ProdutoCardapioDTO;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
    @Transactional(readOnly = true)
    public List<ProdutoListDTO> getAll() {
        return repository.findAllForAdminList().stream()
                .map(ProdutoListDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * MÉTODO CORRIGIDO PARA EVITAR O ERRO MultipleBagFetchException.
     * A lógica agora busca os produtos em etapas para carregar corretamente as coleções aninhadas dos Kits.
     */
    @GetMapping("/cardapio")
    @Transactional(readOnly = true)
    public List<ProdutoCardapioDTO> getProdutosParaCardapio() {
        // 1. Busca todos os produtos do cardápio, incluindo os kits (mas sem as opções dos kits totalmente carregadas).
        List<Produto> produtos = repository.findProdutosForCardapio();

        // 2. Itera sobre os produtos. Se um produto for um kit, fazemos um carregamento explícito
        //    das suas opções para garantir que todos os dados necessários sejam enviados ao frontend.
        //    O @Transactional garante que a sessão do Hibernate permaneça aberta para isso.
        for (Produto p : produtos) {
            if (p.isKit()) {
                p.getGruposKit().forEach(grupo -> grupo.getOpcoes().size()); // Força o carregamento das opções
            }
        }

        // 3. Mapeia a lista completa e corrigida para DTOs.
        return produtos.stream()
                .map(ProdutoCardapioDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Produto> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(produto -> {
                    if (produto.isKit()) {
                        produto.getGruposKit().forEach(grupo -> grupo.getOpcoes().size()); // Força o carregamento
                    }
                    return ResponseEntity.ok(produto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Produto produto) {
        if (produto.getNome() == null || produto.getNome().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("O nome do produto é obrigatório.");
        }
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
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao salvar produto: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        return repository.findById(id).map(produtoExistente -> {
            produtoExistente.setNome(produtoDetails.getNome());
            produtoExistente.setPreco(produtoDetails.getPreco());
            produtoExistente.setCategoria(produtoDetails.getCategoria());
            produtoExistente.setQtdeMax(produtoDetails.getQtdeMax());
            produtoExistente.setCodPdv(produtoDetails.getCodPdv());
            produtoExistente.setDescricao(produtoDetails.getDescricao());
            produtoExistente.setOrdemVisualizacao(produtoDetails.getOrdemVisualizacao());
            produtoExistente.setImagem(produtoDetails.getImagem());
            produtoExistente.setMateriaPrima(produtoDetails.isMateriaPrima());
            produtoExistente.setIsComplemento(produtoDetails.isComplemento());
            produtoExistente.setPermiteComplementos(produtoDetails.isPermiteComplementos());
            produtoExistente.setKit(produtoDetails.isKit());
            produtoExistente.setVendidoIndividualmente(produtoDetails.isVendidoIndividualmente());

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
            Produto updatedProduto = repository.save(produtoExistente);
            return ResponseEntity.ok(updatedProduto);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> getCategorias() {
        return ResponseEntity.ok(repository.findDistinctCategorias());
    }
}