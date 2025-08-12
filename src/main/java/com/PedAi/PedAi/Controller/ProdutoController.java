package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.GrupoComplemento;
import com.PedAi.PedAi.Model.OpcaoComplemento;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.DTO.ProdutoListDTO;
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
        return repository.findAll().stream()
                .map(ProdutoListDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Produto> getById(@PathVariable Long id) {
        Optional<Produto> produtoOpt = repository.findById(id);
        if (produtoOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Produto produto = produtoOpt.get();
        if (produto.isKit()) {
            // Inicializa os grupos e opções
            produto.getGruposKit().forEach(grupo -> grupo.getOpcoes().size());
        }

        return ResponseEntity.ok(produto);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Produto produto) {
        if (produto.getNome() == null || produto.getNome().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("O nome do produto é obrigatório.");
        }
        if (produto.getPreco() == null || produto.getPreco() < 0) {
            return ResponseEntity.badRequest().body("O preço do produto é obrigatório e não pode ser negativo.");
        }

        try {
            if (produto.isKit() && produto.getGruposKit() != null) {
                for (GrupoComplemento grupo : produto.getGruposKit()) {
                    grupo.setProdutoKit(produto);
                    for (OpcaoComplemento opcao : grupo.getOpcoes()) {
                        opcao.setGrupo(grupo);
                        if (opcao.getProduto() != null && opcao.getProduto().getId() != null) {
                            repository.findById(opcao.getProduto().getId())
                                    .ifPresent(opcao::setProduto);
                        }
                    }
                }
            }

            Produto savedProduto = repository.save(produto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduto);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao salvar produto: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        Optional<Produto> produtoOpt = repository.findById(id);
        if (produtoOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Produto produtoExistente = produtoOpt.get();
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
            for (GrupoComplemento grupoNovo : produtoDetails.getGruposKit()) {
                grupoNovo.setProdutoKit(produtoExistente);
                for (OpcaoComplemento opcaoNova : grupoNovo.getOpcoes()) {
                    opcaoNova.setGrupo(grupoNovo);
                    if (opcaoNova.getProduto() != null && opcaoNova.getProduto().getId() != null) {
                        repository.findById(opcaoNova.getProduto().getId())
                                .ifPresent(opcaoNova::setProduto);
                    }
                }
                produtoExistente.getGruposKit().add(grupoNovo);
            }
        }

        Produto updatedProduto = repository.save(produtoExistente);
        return ResponseEntity.ok(updatedProduto);
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
        List<String> categorias = repository.findDistinctCategorias();
        return ResponseEntity.ok(categorias);
    }

    /**
     * Este método envia todos os produtos ativos e que não são matéria-prima para o cardápio.
     */
    @GetMapping("/cardapio")
    @Transactional(readOnly = true)
    public List<Produto> getProdutosParaCardapio() {
        return repository.findAll().stream()
                .filter(Produto::isAtivo)
                .filter(p -> !p.isMateriaPrima())
                .collect(Collectors.toList());
    }
}
