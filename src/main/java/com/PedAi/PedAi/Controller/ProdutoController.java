package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.PedAi.PedAi.DTO.ProdutoListDTO;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
    @Transactional(readOnly = true)
    public List<ProdutoListDTO> getAll() {
        List<Produto> produtos = repository.findAll();
        return produtos.stream()
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
            produto.getGruposKit().forEach(grupo -> grupo.getOpcoes().size());
        }
        return ResponseEntity.ok(produto);
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
            System.err.println("Erro ao criar produto: " + e.getMessage());
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

    /**
     * MÉTODO-CHAVE DA SOLUÇÃO:
     * Este método é responsável por enviar a lista de produtos para a tela do cardápio.
     * A lógica aqui garante que TODOS os produtos ativos que NÃO SÃO matéria-prima sejam enviados.
     * Isso corrige o erro "Produto... não encontrado", pois a lista no frontend estará completa.
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